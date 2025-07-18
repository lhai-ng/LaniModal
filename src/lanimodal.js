
LaniModal.elements = [];

function LaniModal(options = {}) {
    if (!options.content && !options.templateId) {
        console.error("You must provide one of 'content' or 'templateId'");
    }

    if (options.content && options.templateId) {
        options.templateId = null;
        console.warn("When using 'templateId', do not provide 'content'. If both are specified, 'content' will take precedence, and 'templateId' will be ignored.");
    }

    if (options.templateId) {
        this.template = document.querySelector(`#${options.templateId}`);
        if (!this.template) return console.error(`${options.templateId} does not exist!`);
    }

    this.opt = Object.assign({
        destroyOnClose: true, 
        closeMethods: ['button', 'overlay', 'escape'],
        cssClass: [],
        footer: false,
        enableScrollLock: true,
        scrollLockTarget: () => document.body,
    }, options)
    
    this.content = this.opt.content;
    const {closeMethods} = this.opt;
    this._allowButtonClose = closeMethods.includes('button');
    this._allowBackdropClose = closeMethods.includes('overlay');
    this._allowEscapeClose = closeMethods.includes('escape');

    this._footerButtons = [];

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

LaniModal.prototype._build = function() {
    const contentNode = this.content ? document.createElement('div') : this.template.content.cloneNode(true);
    
    if (this.content) {
        contentNode.innerHTML = this.content;
    }

    // Create modal elements
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'lanimodal';

    const container = document.createElement('div');
    container.className = 'lanimodal__container';

    this.opt.cssClass.forEach(className => {
        if (typeof className === 'string') {
            container.classList.add(`${className}`);
        } 
    })

    if (this._allowButtonClose) {
        const closeBtn = this._createButton(
            "&times;",
            'lanimodal__close', 
            () => this.close()
        ); 
        container.append(closeBtn);
    }
    

    this._modalContent = document.createElement('div');
    this._modalContent.className = 'lanimodal__content';

    // Append content and elements
    this._modalContent.append(contentNode);
    container.append(this._modalContent);

    if (this.opt.footer) {
        this._modalFooter = document.createElement('div')
        this._modalFooter.className = 'lanimodal__footer';

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._modalFooter);
    }

    this._backdrop.append(container);
    document.body.append(this._backdrop);
}

LaniModal.prototype.setContent = function(content) {
    this.content = content;
    if (this._modalContent) {
        this._modalContent.innerHTML = this.content;
    }
};

LaniModal.prototype.setFooterContent = function(content) {
    this._footerContent = content;
    this._renderFooterContent();
}

LaniModal.prototype.addFooterButton = function(title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButtons.push(button);
    this._renderFooterButtons();
};

LaniModal.prototype._renderFooterContent = function() {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
}

LaniModal.prototype._renderFooterButtons = function() {
    if (this._modalFooter) {
        this._footerButtons.forEach((button) => {
            this._modalFooter.append(button);
        })
    }
}

LaniModal.prototype._createButton = function(title, cssClass, callback) {
    const button = document.createElement('button');
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button
}

LaniModal.prototype.open = function() {
    if (!this._backdrop) {
        this._build();
    }
    
    setTimeout(() => {
        this._backdrop.classList.add('lanimodal--show')
    }, 0)

    // Attach event listener

    if (this._allowBackdropClose) {
        this._backdrop.onclick = e => {
            if (e.target === this._backdrop) {
                this.close();
            }
        }
    }

    if (this._allowEscapeClose) {
        document.addEventListener('keydown', this._handleEscapeKey)
    };

    LaniModal.elements.push(this);

    this._onTransitionEnd(this.opt.onOpen);
        
    // Disable Scrolling
    if (LaniModal.elements.length === 1 && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();

        if (this._hasScrollbar(target)) {
            target.classList.add('lanimodal--no-scroll');

            const targetPaddingRight = parseInt(getComputedStyle(target).paddingRight);
            target.style.paddingRight = targetPaddingRight + this._getScrollbarWidth() + 'px';
        }
    }
    
    return this._backdrop;
}

LaniModal.prototype._hasScrollbar = (target) => {
    if ([document.documentElement, document.body].includes(target)) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight ||
        document.body.scrollHeight > document.body.clientHeight ;
    }
    return target.scrollHeight > target.clientHeight;
}

LaniModal.prototype._handleEscapeKey = function(e) {
    if (e.key === 'Escape' && this === LaniModal.elements[LaniModal.elements.length - 1]) {
        this.close();
    }
};

LaniModal.prototype._onTransitionEnd = function(callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== 'transform') return;
        if (typeof callback === 'function') callback();
    }
}

LaniModal.prototype.close = function(destroy = this.opt.destroyOnClose)  {
    this._backdrop.classList.remove('lanimodal--show');

    LaniModal.elements.pop();
    
    if (this._allowEscapeClose) {
        document.removeEventListener('keydown', this._handleEscapeKey)
    };

    this._onTransitionEnd(() => {
            if (typeof this.opt.onClose === 'function') this.opt.onClose();

        if (destroy && this._backdrop) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }

        // Enable Scrolling
        if (!LaniModal.elements.length && this.opt.enableScrollLock) {
            const target = this.opt.scrollLockTarget();

            if (this._hasScrollbar(target)) {
                target.classList.remove('lanimodal--no-scroll');
                target.style.paddingRight = '';
            }
        }
    });
}

LaniModal.prototype.destroy = function() {
    this.close();
}

LaniModal.prototype._getScrollbarWidth = function() {
    if (this._scrollbarWidth) return this._scrollbarWidth;

    const div = document.createElement('div');
    Object.assign(div.style, {
        overflow: 'scroll',
        position: 'absolute',
        top: '-9999px'
    });

    document.body.appendChild(div);
    this._scrollbarWidth = div.offsetWidth - div.clientWidth;
    

    document.body.removeChild(div);
    return this._scrollbarWidth;
}






