
LaniModal.elements = [];

function LaniModal(options = {}) {
    this.opt = Object.assign({
        destroyOnClose: true, 
        closeMethods: ['button', 'overlay', 'escape'],
        cssClass: [],
        footer: false,
    }, options)
    this.template = document.querySelector(`#${this.opt.templateId}`);
    
    const {closeMethods} = this.opt;
    this._allowButtonClose = closeMethods.includes('button');
    this._allowBackdropClose = closeMethods.includes('overlay');
    this._allowEscapeClose = closeMethods.includes('escape');

    this._footerButtons = [];

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

LaniModal.prototype._build = function() {
    let content = document.createElement('div');
    if (this.opt.content) {
        content.innerHTML = this.opt.content;
    } else {
        content = this.template.content.cloneNode(true);
    }

    // Create modal elements
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'lanimodal__backdrop';

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
    

    const modalContent = document.createElement('div');
    modalContent.className = 'lanimodal__content';

    // Append content and elements
    modalContent.append(content);
    container.append(modalContent);

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

LaniModal.prototype.setFooterContent = function(html) {
    this._footerContent = html;
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
    document.body.classList.add('lanimodal--no-scroll');
    document.body.style.paddingRight = this._getScrollbarWidth() + 'px';

    return this._backdrop;
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
        if (!LaniModal.elements.length) {
            document.body.classList.remove('lanimodal--no-scroll');
            document.body.style.paddingRight = '';
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






