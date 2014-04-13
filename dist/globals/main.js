!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.ic||(f.ic={})).modal=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
var ModalComponent = _dereq_("./modal")["default"] || _dereq_("./modal");
var ModalTriggerComponent = _dereq_("./modal-trigger")["default"] || _dereq_("./modal-trigger");
var ModalTitleComponent = _dereq_("./modal-title")["default"] || _dereq_("./modal-title");
var css = _dereq_("./templates/modal-css")["default"] || _dereq_("./templates/modal-css");
var modalTemplate = _dereq_("./templates/modal")["default"] || _dereq_("./templates/modal");
var Application = window.Ember.Application;
_dereq_("./tabbable-selector");
Application.initializer({
  name: 'ic-modal',
  initialize: function(container) {
    container.register('component:ic-modal', ModalComponent);
    container.register('component:ic-modal-trigger', ModalTriggerComponent);
    container.register('component:ic-modal-title', ModalTitleComponent);
    container.register('template:components/ic-modal-css', css);
    container.register('template:components/ic-modal', modalTemplate);
  }
});

exports.ModalComponent = ModalComponent;
exports.ModalTriggerComponent = ModalTriggerComponent;
exports.ModalTitleComponent = ModalTitleComponent;
},{"./modal":4,"./modal-title":2,"./modal-trigger":3,"./tabbable-selector":5,"./templates/modal":7,"./templates/modal-css":6}],2:[function(_dereq_,module,exports){
"use strict";
var Ember = window.Ember["default"] || window.Ember;

exports["default"] = Ember.Component.extend({
  
  tagName: 'ic-modal-title',

  attributeBindings: ['aria-hidden'],

  /**
   * Tells the screenreader not to read this element. The modal has its
   * 'aria-describedby' set to the id of this element so it would be
   * redundant.
   *
   * @property aria-hidden
   */

  'aria-hidden': 'true',

  /**
   * @method registerTitle
   * @private
   */

  registerWithModal: function() {
    this.get('parentView').registerTitle(this);
  }.on('willInsertElement')
    
});
},{}],3:[function(_dereq_,module,exports){
"use strict";
var Component = window.Ember.Component;
var computed = window.Ember.computed;
var ModalComponent = _dereq_("./modal")["default"] || _dereq_("./modal");

exports["default"] = Component.extend({

  classNames: ['ic-modal-trigger'],

  attributeBindings: ['aria-label'],

  /**
   * We aren't using a tagName because we want these to always be
   * buttons. Maybe when web components land for real we can inherit
   * from HTMLButtonElement and get <ic-modal-trigger> :D
   *
   * If you change the tagName you must add tabindex and implement keyboard events
   * like a button.
   *
   * @property tagName
   * @private
   */

  tagName: 'button',

  /**
   * Finds the modal this element controls. If a toggler is a child of
   * the modal, you do not need to specify a "controls" attribute.
   *
   * @method findModal
   * @private
   */

  findModal: function() {
    var parent = findParent(this);
    if (parent) {
      // we don't care about "controls" if we are child
      this.set('modal', parent);
      parent.registerTrigger(this);
    } else {
      // later so that DOM order doesn't matter
      Ember.run.schedule('afterRender', this, function() {
        this.set('modal', Ember.View.views[this.get('controls')]);
      });
    }
  }.on('willInsertElement'),

  /**
   * Shows or hides the associated modal.
   *
   * @method toggleModalVisibility
   * @private
   */

  toggleModalVisibility: function(event) {
    // don't focus if it was a mouse click, cause that's ugly
    var wasMouse = event.clientX && event.clientY;
    this.get('modal').toggleVisibility(this, {focus: !wasMouse});
  }.on('click'),

  /**
   * When a modal closes it will return focus to the trigger that opened
   * it, keeping the user's focus position.
   *
   * @method focus
   * @public
   */

  focus: function() {
    this.$()[0].focus();
  }

});

function findParent(trigger) {
  var parent = trigger.get('parentView');
  if (!parent) return false;
  if (parent instanceof ModalComponent) return parent;
  return findParent(parent);
}
},{"./modal":4}],4:[function(_dereq_,module,exports){
"use strict";
// http://www.w3.org/TR/wai-aria-practices/#dialog_modal

var Ember = window.Ember["default"] || window.Ember;

var alias = Ember.computed.alias;

/**
 * If you do something to move focus outside of the browser (like
 * command+l to go to the address bar) and then tab back into the
 * window, capture it and focus the first tabbable element in an active
 * modal.
 */

var lastOpenedModal = null;

window.addEventListener('focus', handleTabIntoBrowser, true);

function handleTabIntoBrowser(event) {
  if (!lastOpenedModal || event.target !== window) return;
  Ember.run.later(lastOpenedModal, 'focus', 0);
  event.preventDefault();
}

/**
 * Accessible modal dialog component.
 *
 * @class Modal
 */

exports["default"] = Ember.Component.extend({

  tagName: 'ic-modal',

  attributeBindings: [
    'after-open',
    'aria-hidden',
    'aria-labeledby',
    'is-open',
    'role',
    'tabindex'
  ],

  /**
   * Allows for css transitions, the class is added after the dialog is
   * set to display: block. For example, to create a fade in effect:
   *
   * ```css
   * ic-dialog[is-open] {
   *   opacity: 0;
   *   transition: opacity 150ms ease;
   * }
   *
   * ic-dialog[after-open] {
   *   opacity: 1;
   * }
   * ```
   *
   * @property after-open
   * @private
   */

  'after-open': null,

  /**
   * It is counter-intuitive to have a tabindex of 0 since we don't want
   * the modal to actually be tabbable. However, were it not tabbable
   * and you click inside of it, the document gets focus and ruins all of
   * our tab navigation scoping. Now that it will keep focus, tabbing
   * after a click will work as expected. It's not actually tabbable,
   * however, since the modal is display:none when closed, and we hijack
   * tabs on the last and first tabbable elements when open.
   *
   * @property tabindex
   * @private
   */

  tabindex: 0,

  /**
   * Tells the screenreader not to read this when closed.
   *
   * @property aria-hidden
   * @private
   */

  'aria-hidden': function() {
    // coerce to string cause that's how the screenreaders like it
    return !this.get('isOpen')+'';
  }.property('isOpen'),

  /**
   * When the dialog opens the screenreader will get the label from the
   * title component
   *
   * @property aria-labeledby
   * @private
   */

  'aria-labeledby': alias('titleComponent.elementId'),

  /**
   * Used as a bound attribute so you can style modals with
   * `ic-modal[is-open] {}`.
   *
   * @property is-open
   * @private
   */

  'is-open': function() {
    return this.get('isOpen') ? 'true' : null;
  }.property('isOpen'),

  /**
   * Tells the screenreader to treat this element as a dialog.
   *
   * @property role
   * @private
   */

  role: 'dialog',

  /**
   * @property isOpen
   * @private
   */

  isOpen: false,

  /**
   * Opens the modal. Takes one option `{focus: false}`, which defaults
   * to false. If false it won't try to focus the dialog after it opens,
   * this is used when the modal is opened by a mouse click.
   *
   * @method open
   * @public
   */

  open: function(options) {
    options = options || {};
    this.set('isOpen', true);
    lastOpenedModal = this;
    Ember.run.schedule('afterRender', this, function() {
      this.set('after-open', 'true');
      if (options.focus !== false) {
        this.focus();
      } else {
        // focus the whole thing so that tab will work next time
        this.$().focus();
      }
    });
  },

  /**
   * Closes the dialog and also focuses the trigger that opened it in
   * the first place so the user's tab position is preserved with fierce
   * integrity.
   *
   * @method close
   * @public
   */

  close: function() {
    this.set('isOpen', false);
    this.set('after-open', null);
    lastOpenedModal = null;
    var toggler = this.get('toggler');
    toggler && toggler.focus();
  },

  /**
   * We need to focus the first tabbable element so that keyboard and
   * screenreader users end up in the right place after the dialog is
   * opened (or when the users tabs back into the browser window from
   * the browser chrome). There should always be a close button, and
   * therefore always something to focus.
   *
   * @method focus
   * @private
   */

  focus: function() {
    this.$(':tabbable').first().focus();
  },

  /**
   * Shows or hides the modal, depending on current state.
   *
   * @method toggleVisibility
   * @param toggler ic.modal.ToggleComponent
   * @param options Object
   * @public
   */

  toggleVisibility: function(toggler, options) {
    if (this.get('isOpen')) {
      this.close();
      this.set('toggler', null);
    } else {
      this.open(options);
      if (toggler) {
        this.set('toggler', toggler);
      }
    }
  },

  /**
   * @method handleKeyDown
   * @private
   */

  handleKeyDown: function(event) {
    if (event.keyCode == 9 /*tab*/) this.keepTabNavInside(event);
    if (event.keyCode == 27 /*esc*/) this.close();
  }.on('keyDown'),

  /**
   * When the dialog is open, we want to keep all tab navigation scoped
   * to the dialog since the point of a modal is to temporarily branch
   * the current user workflow. Tabbing on the last or first tabbable
   * elements will loop back around the other.
   *
   * @method keepTabNavInside
   * @private
   */

  keepTabNavInside: function(event) {
    if (event.keyCode !== 9) return;
    var tabbable = this.$(':tabbable');
    var finalTabbable = tabbable[event.shiftKey ? 'first' : 'last']()[0];
    var leavingFinalTabbable = (
      finalTabbable === document.activeElement ||
      // handle immediate shift+tab after opening with mouse
      this.get('element') === document.activeElement
    );
    if (!leavingFinalTabbable) return;
    event.preventDefault();
    tabbable[event.shiftKey ? 'last' : 'first']()[0].focus();
  },

  /**
   * Clicking outside the dialog should close it. We don't need to
   * handle other forms of losing focus (like keyboard nav) because we
   * already handle all of the keyboard navigation when its open.
   *
   * @method closeOnClick
   * @private
   */

  closeOnClick: function(event) {
    if (event.target !== this.get('element')) return;
    this.close();
  }.on('click'),

  /**
   * Often you need a mechanism besides an ic-modal-toggle to close an
   * open dialog; when you have a dialog with a form, you want to close
   * the dialog when the form has been submitted. You can bind to this
   * attribute and set it to true, causing the dialog to close.
   *
   * ```html
   * {{#ic-modal close-when=formIsSubmitted}}
   *   <form {{action "submitForm" on="submit"}}>
   *     <button type="submit">submit</button>
   *   </form>
   * {{/ic-modal}}
   * ```
   *
   * ```js
   * App.ApplicationController = Ember.Controller.extend({
   *   actions: {
   *     submitForm: function() {
   *       // do some work
   *       this.set('formIsSubmitted', true); // dialog closes
   *     }
   *   }
   * });
   * ```
   *
   * @property close-when
   * @public
   */

  'close-when': false,

  /**
   * Facilitates 'close-when' behavior.
   *
   * @method closeWhen
   * @private
   */

  closeWhen: function() {
    if (!this.get('close-when')) return;
    this.close();
    this.set('close-when', false);
  }.observes('close-when'),

  /**
   * All Dialogs need a title for the screenreader (and the UI, usually
   * anyway) and a close button. If a modal does not have an
   * `ic-modal-title` or an `ic-modal-toggle` then this will create some
   * defaults.
   *
   * @method maybeMakeDefaultChildren
   * @private
   */

  maybeMakeDefaultChildren: function() {
    if (!this.get('titleComponent')) this.set('makeTitle', true);
    if (!this.get('triggerComponent')) this.set('makeTrigger', true);
  }.on('didInsertElement'),

  /**
   * @method registerTitle
   * @private
   */

  registerTitle: function(component) {
    this.set('titleComponent', component);
  },

  /**
   * @method registerTrigger
   * @private
   */

  registerTrigger: function(component) {
    this.set('triggerComponent', component);
  }

});
},{}],5:[function(_dereq_,module,exports){
"use strict";
/*!
 * Adapted from jQuery UI core
 *
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/category/ui-core/
 */

var Ember = window.Ember["default"] || window.Ember;

var $ = Ember.$;

function focusable( element, isTabIndexNotNaN ) {
  var nodeName = element.nodeName.toLowerCase();
  return ( /input|select|textarea|button|object/.test( nodeName ) ?
    !element.disabled :
    "a" === nodeName ?
      element.href || isTabIndexNotNaN :
      isTabIndexNotNaN) && visible( element );
}

function visible( element ) {
  return $.expr.filters.visible( element ) &&
    !$( element ).parents().addBack().filter(function() {
      return $.css( this, "visibility" ) === "hidden";
    }).length;
}

if (!$.expr[':'].tabbable) {
  $.expr[':'].tabbable = function( element ) {
    var tabIndex = $.attr( element, "tabindex" ),
      isTabIndexNaN = isNaN( tabIndex );
    return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
  }
};
},{}],6:[function(_dereq_,module,exports){
"use strict";
var Ember = window.Ember["default"] || window.Ember;
exports["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  


  data.buffer.push("ic-modal-screen,\nic-modal,\nic-modal-content,\nic-modal-title {\n  display: block;\n}\n\nic-modal {\n  background-color: rgba(255, 255, 255, .75);\n  display: none;\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  padding: 10px;\n}\n\nic-modal[is-open] {\n  display: block;\n}\n\nic-modal-content {\n  background: #fff;\n  border: 1px solid hsl(0, 0%, 70%);\n  position: relative;\n  max-width: 800px;\n  margin: 40px auto;\n  border-radius: 4px;\n  padding: 20px;\n}\n\nic-modal-title {\n  border-bottom: 1px solid hsl(0, 0%, 90%);\n  padding: 0 20px 20px 20px;\n  margin: 0 -20px 20px -20px;\n  font-weight: 600;\n}\n\n.ic-modal-trigger.default {\n  position: absolute;\n  top: 10px;\n  right: 20px;\n  border: none;\n  background: none;\n  padding: 6px;\n  font-size: 18px;\n  color: inherit;\n}\n\n.ic-modal-trigger.default:focus {\n  text-shadow: 0 0 6px hsl(208, 47%, 60%),\n    0 0 2px hsl(208, 47%, 60%),\n    0 0 2px hsl(208, 47%, 60%),\n    0 0 1px hsl(208, 47%, 60%);\n  outline: none;\n}\n\n");
  
});
},{}],7:[function(_dereq_,module,exports){
"use strict";
var Ember = window.Ember["default"] || window.Ember;
exports["default"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = '', stack1, helper, options;
  data.buffer.push("\n    ");
  options={hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[],types:[],data:data}
  if (helper = helpers['ic-modal-title']) { stack1 = helper.call(depth0, options); }
  else { helper = (depth0 && depth0['ic-modal-title']); stack1 = typeof helper === functionType ? helper.call(depth0, options) : helper; }
  if (!helpers['ic-modal-title']) { stack1 = blockHelperMissing.call(depth0, 'ic-modal-title', {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(2, program2, data),contexts:[],types:[],data:data}); }
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n  ");
  return buffer;
  }
function program2(depth0,data) {
  
  
  data.buffer.push("Modal Content");
  }

function program4(depth0,data) {
  
  var buffer = '', stack1, helper, options;
  data.buffer.push("\n    ");
  stack1 = (helper = helpers['ic-modal-trigger'] || (depth0 && depth0['ic-modal-trigger']),options={hash:{
    'class': ("default"),
    'aria-label': ("close")
  },hashTypes:{'class': "STRING",'aria-label': "STRING"},hashContexts:{'class': depth0,'aria-label': depth0},inverse:self.noop,fn:self.program(5, program5, data),contexts:[],types:[],data:data},helper ? helper.call(depth0, options) : helperMissing.call(depth0, "ic-modal-trigger", options));
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n  ");
  return buffer;
  }
function program5(depth0,data) {
  
  
  data.buffer.push("×");
  }

  data.buffer.push("<ic-modal-content>\n\n  ");
  stack1 = helpers['if'].call(depth0, "makeTitle", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(1, program1, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n  ");
  stack1 = helpers['if'].call(depth0, "makeTrigger", {hash:{},hashTypes:{},hashContexts:{},inverse:self.noop,fn:self.program(4, program4, data),contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n  ");
  stack1 = helpers._triageMustache.call(depth0, "yield", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("\n\n</ic-modal-content>\n\n");
  return buffer;
  
});
},{}]},{},[1])
(1)
});