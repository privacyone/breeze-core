// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'breeze://resources/cr_elements/cr_toast/cr_toast.m.js';
import 'breeze://resources/cr_elements/cr_view_manager/cr_view_manager.m.js';
import 'breeze://resources/cr_elements/hidden_style_css.m.js';
import './google_apps/nux_google_apps.js';
import './landing_view.js';
import './ntp_background/nux_ntp_background.js';
import './set_as_default/nux_set_as_default.js';
import './signin_view.js';
import '../strings.m.js';

import {assert} from 'breeze://resources/js/assert.m.js';
import {loadTimeData} from 'breeze://resources/js/load_time_data.m.js';
import {html, Polymer} from 'breeze://resources/polymer/v3_0/polymer/polymer_bundled.min.js';

//import {navigateTo, navigateToNextStep, NavigationBehavior, Routes} from './navigation_behavior.js';
import {BookmarkBarManager} from './shared/bookmark_proxy.js';
import {WelcomeBrowserProxyImpl} from './welcome_browser_proxy.js';
import {ImportDataBrowserProxyImpl, ImportDataStatus, BrowserProfile} from './import_data_browser_proxy.js';
import {NuxSetAsDefaultProxy, NuxSetAsDefaultProxyImpl} from './set_as_default/nux_set_as_default_proxy.js';
import {SearchEngine, SearchEnginesInfo, SearchEnginesBrowserProxyImpl} from './search_engines_browser_proxy.js';

import {WebUIListenerBehavior} from 'breeze://resources/js/web_ui_listener_behavior.m.js';
import {I18nBehavior} from 'breeze://resources/js/i18n_behavior.m.js';

const PrefsBehavior = {
  properties: {
    /** Preferences state. */
    prefs: {
      type: Object,
      notify: true,
    },
  },

  /**
   * Gets the pref at the given prefPath. Throws if the pref is not found.
   * @param {string} prefPath
   * @return {!chrome.settingsPrivate.PrefObject}
   * @protected
   */
  getPref(prefPath) {
    const pref = /** @type {!chrome.settingsPrivate.PrefObject} */ (
        this.get(prefPath, this.prefs));
    assert(typeof pref != 'undefined', 'Pref is missing: ' + prefPath);
    return pref;
  },

  /**
   * Sets the value of the pref at the given prefPath. Throws if the pref is not
   * found.
   * @param {string} prefPath
   * @param {*} value
   * @protected
   */
  setPrefValue(prefPath, value) {
    this.getPref(prefPath);  // Ensures we throw if the pref is not found.
    this.set('prefs.' + prefPath + '.value', value);
  },

  /**
   * Appends the item to the pref list at the given key if the item is not
   * already in the list. Asserts if the pref itself is not found or is not an
   * Array type.
   * @param {string} key
   * @param {*} item
   * @protected
   */
  appendPrefListItem(key, item) {
    const pref = this.getPref(key);
    assert(pref && pref.type == chrome.settingsPrivate.PrefType.LIST);
    if (pref.value.indexOf(item) == -1) {
      this.push('prefs.' + key + '.value', item);
    }
  },

  /**
   * Deletes the given item from the pref at the given key if the item is found.
   * Asserts if the pref itself is not found or is not an Array type.
   * @param {string} key
   * @param {*} item
   * @protected
   */
  deletePrefListItem(key, item) {
    assert(this.getPref(key).type == chrome.settingsPrivate.PrefType.LIST);
    this.arrayDelete('prefs.' + key + '.value', item);
  },
};


Polymer({
  is: 'welcome-app',

  _template: html`{__html_template__}`,

  behaviors: [I18nBehavior, WebUIListenerBehavior, PrefsBehavior],

  properties: {
    /** @private {!Array<!settings.BrowserProfile>} */
    browserProfiles_: Array,

    /** @private {!settings.BrowserProfile} */
    selected_: Object,

    /**
     * Whether none of the import data categories is selected.
     * @private
     */
    noImportDataTypeSelected_: {
      type: Boolean,
      value: false,
    },

    /** @private */
    importStatus_: {
      type: String,
      value: ImportDataStatus.INITIAL,
    },

    /**
     * Mirroring the enum so that it can be used from HTML bindings.
     * @private
     */
    importStatusEnum_: {
      type: Object,
      value: ImportDataStatus,
    },

    /**
     * List of default search engines available.
     * @private {!Array<!SearchEngine>}
     */
    searchEngines_: {
      type: Array,
      value() {
        return [];
      }
    },

    /** @private Filter applied to search engines. */
    searchEnginesFilter_: String,
  },

  observers: [
    'prefsChanged_(selected_, prefs.*)',
  ],

  browserProxy_: null,

  enginesProxy_: null,

  /** @private {NuxSetAsDefaultProxy} */
  setAsDefaultProxy_: null,

  /** @private {boolean} */
  finalized_: false,


  ready()
  {
    //this.$$(".dot.page1").classList.add('active');
    //Updating right side dots dynamically
    const dotsStorage = sessionStorage.getItem("dotsStorage");
    if(dotsStorage === null)
    {
      this.$$(".dot.page1").classList.add('active');
      this.rippleTimeout(1200);
    }
    else
    {
      this.$$(".dot."+dotsStorage).classList.add('active');
    }
    this.browserProxy_ = ImportDataBrowserProxyImpl.getInstance();
    this.browserProxy_.initializeImportDialog().then(data => {
      this.browserProfiles_ = data;
      this.selected_ = this.browserProfiles_[0];

      // Show only available browsers
      for(let x of this.browserProfiles_)
      {
        const shortName = x.name.split(' ');
        if(shortName.includes("Mozilla"))
        {
          this.onlyShowAvailable_(x, "Mozilla");
          continue;
        }
        if(shortName.includes("Chrome"))
        {
          this.onlyShowAvailable_(x, "Chrome");
          continue;
        }
        if(shortName.includes("Chromium"))
        {
          this.onlyShowAvailable_(x, "Chromium");
          continue;
        }
        if(shortName.includes("Opera"))
        {
          this.onlyShowAvailable_(x, "Opera");
          continue;
        }
        if(shortName.includes("Brave"))
        {
          this.onlyShowAvailable_(x, "Brave");
          continue;
        }
        if(shortName.includes("Edge"))
        {
          this.onlyShowAvailable_(x, "Edge");
          continue;
        }
        if(shortName.includes("Explorer"))
        {
          this.onlyShowAvailable_(x, "Explorer");
          continue;
        }
        if(shortName.includes("Safari"))
        {
          this.onlyShowAvailable_(x, "Safari");
          continue;
        }
      }
    });

    this.addWebUIListener('import-data-status-changed', importStatus => {
      this.importStatus_ = importStatus;
      if (this.hasImportStatus_(ImportDataStatus.FAILED)) {
        this.closeDialog_();
      }
    });

    this.setAsDefaultProxy_ = NuxSetAsDefaultProxyImpl.getInstance();
    this.addWebUIListener(
        'browser-default-state-changed',
        this.onDefaultBrowserChange_.bind(this));

    this.enginesProxy_ = SearchEnginesBrowserProxyImpl.getInstance();
    const updateSearchEngines = searchEngines => {
      this.set('searchEngines_', searchEngines.defaults);
    };
    this.enginesProxy_.getSearchEnginesList().then(updateSearchEngines);
    this.addWebUIListener('search-engines-changed', updateSearchEngines);
  },

  rippleTimeout(delay, itr = 2) {
    let that = this;
    setTimeout(function(){ that.ripple(itr); }, delay);
  },

  ripple(iterations){
    let elements = this.shadowRoot.querySelectorAll('.arrow-ripple');
    elements.forEach(elm => {
      elm.style.animation = "ripple 700ms linear " + iterations;
      let newelm = elm.cloneNode(true);
      elm.parentNode.replaceChild(newelm, elm);
    })
  },

  onlyShowAvailable_(browserObject, browserClassName)
  {
    let slideButton = this.$[browserClassName];
    slideButton.classList.remove('hidden');


    let checkboxes = slideButton.querySelectorAll('p');
    if(browserObject.favorites)
    {
      checkboxes[0].classList.remove('hidden');
    }
    if(browserObject.history)
    {
      checkboxes[1].classList.remove('hidden');
    }
    if(browserObject.passwords)
    {
      checkboxes[2].classList.remove('hidden');
    }
    if(browserObject.search)
    {
      checkboxes[3].classList.remove('hidden');
    }
    if(browserObject.autofillFormData)
    {
      checkboxes[4].classList.remove('hidden');
    }
  },

  hasImportStatus_(status) {
    return this.importStatus_ == status;
  },

  setDefaultEngine_(e) {
    const engineID = e.currentTarget.getAttribute("id");
    this.enginesProxy_.setDefaultSearchEngine(this.findIndexOfEngine_(engineID));
    this.toggleRadio_(e);
    this.rippleTimeout(200);
  },

  findIndexOfEngine_(target)
  {
    for(let engine of this.searchEngines_)
    {
      if(engine.name == target)
      {
        return engine.modelIndex;
      }
    }
  },

  onBrowserProfileSelectionChange_() {
    this.selected_ = this.browserProfiles_[this.$.browserSelect.selectedIndex];
  },

  prefsChanged_() {
    if (this.selected_ == undefined || this.prefs == undefined) {
      return;
    }

    this.noImportDataTypeSelected_ =
        !(this.getPref('import_dialog_history').value &&
            this.selected_.history) &&
        !(this.getPref('import_dialog_bookmarks').value &&
            this.selected_.favorites) &&
        !(this.getPref('import_dialog_saved_passwords').value &&
            this.selected_.passwords) &&
        !(this.getPref('import_dialog_search_engine').value &&
            this.selected_.search) &&
        !(this.getPref('import_dialog_autofill_form_data').value &&
            this.selected_.autofillFormData);
  },

  getActionButtonText_() {
    return this.i18n(
        this.isImportFromFileSelected_() ? 'importChooseFile' : 'importCommit');
  },

  onDeclineClick_() {
    if (this.finalized_) {
      return;
    }

    this.setAsDefaultProxy_.recordSkip();
    this.finished_();
  },

  /** @private */
  onSetDefaultClick_() {
    if (this.finalized_) {
      this.finished_();
      return;
    }

    this.setAsDefaultProxy_.requestDefaultBrowserState().then((status) => {
      if(status.isDefault)
      {
        this.finished_();
      }
    });

    this.setAsDefaultProxy_.recordBeginSetDefault();
    this.setAsDefaultProxy_.setAsDefault();
  },

  onDefaultBrowserChange_(status) {
    if (status.isDefault) {
      this.setAsDefaultProxy_.recordSuccessfullySetDefault();
      this.finished_();
      return;
    }

    window.setTimeout(() => {
      this.setAsDefaultProxy_.requestDefaultBrowserState().then(
          this.onDefaultBrowserChange_.bind(this));
    }, 100);
  },

  handlePageChange_(targetPage){
    let currentPage = this.$$(".dot.active").classList[1];
    if (currentPage !== targetPage){
      switch (currentPage) {
        case "page2":
          this.importFromBrowser_();
          break;
      }
    }
    this.$$(".dot.active").classList.remove('active');
    sessionStorage.setItem("dotsStorage", targetPage);
    this.$$(".dot."+targetPage).classList.add('active');
    switch(targetPage)
    {
      case "page1":
        this.rippleTimeout(1200);
        break;
      case "page5":
        this.rippleTimeout(800);
        break;
    }
  },

  smoothScroll_(e) {
    let sectionId = e.currentTarget.getAttribute('section-id');
    this.$[sectionId].scrollIntoView({
      behavior: 'smooth',
      block: "end",
      inline: "nearest"
    });
    this.handlePageChange_(sectionId);
  },

  switchTabs_(e) {
    let brwsr = e.currentTarget.classList[0];
    this.$$(".tab-container").querySelectorAll(".tab-content").forEach(element => {
      element.classList.add('hidden');
    });
    this.$$(".tab-content."+brwsr).classList.remove('hidden');
  },

  toggleCheckbox_(e) {
    e.currentTarget.classList.toggle('checked');

    // blue indicator thingy
    let button = e.currentTarget.parentElement.parentElement.parentElement;
    let numOfTogglesChecked = button.querySelectorAll('.checked').length;
    if (numOfTogglesChecked == 0){
      button.classList.remove('checked');
    }
    else if (numOfTogglesChecked == 1)
    {
      button.classList.add('checked');
    }

  },

  toggleRadio_(e) {
    let picked = e.currentTarget;
    picked.parentElement.childNodes.forEach(node =>{
      node.classList.remove('active');
    });
    picked.classList.add('active');
  },

  scrollToDivID_(divName) {
    let sectionId = divName;
    this.$[sectionId].scrollIntoView({
      behavior: 'smooth',
      block: "end",
      inline: "nearest"
    });
    this.handlePageChange_(sectionId);
  },

  rippleOut_(e) {
    if (e.currentTarget.querySelectorAll('.checked').length && (getComputedStyle(e.currentTarget.querySelector('.tick')).fontSize != "50px"))
      this.rippleTimeout(100,2);
  },

  goToNewTabPage_() {
    sessionStorage.setItem("dotsStorage", "page1");
    window.location.replace('breeze://newtab');
  },

  finished_() {
    this.finalized_ = true;
    this.scrollToDivID_("page5");
  },

  importCheckedData_(browserObject, browserName, types) {
    let slideButton = this.$[browserName];
    slideButton.querySelectorAll(".checked").forEach(node =>{
      if(node.classList.contains('favorites')){
        types['import_dialog_bookmarks'] = true;
      }
      if(node.classList.contains('history')){
        types['import_dialog_history'] = true;
      }
      if(node.classList.contains('passwords')){
        types['import_dialog_saved_passwords'] = true;
      }
      if(node.classList.contains('search')){
        types['import_dialog_search_engine'] = true;
      }
      if(node.classList.contains('autofillFormData')){
        types['import_dialog_autofill_form_data'] = true;
      }
    });
    this.browserProxy_.importData(browserObject.index, types);
    slideButton.classList.add('done')
  },

  importFromBrowser_()
  {
    for(let x of this.browserProfiles_)
    {
      const types = {};
      types['import_dialog_history'] = false;
      types['import_dialog_bookmarks'] = false;
      types['import_dialog_saved_passwords'] = false;
      types['import_dialog_search_engine'] =false;
      types['import_dialog_autofill_form_data'] = false;
      let y = x.name.split(' ');
      if(y.includes("Mozilla"))
      {
        this.importCheckedData_(x, "Mozilla", types);
        continue;
      }
      if(y.includes("Chrome"))
      {
        this.importCheckedData_(x, "Chrome", types);
        continue;
      }
      if(y.includes("Chromium"))
      {
        this.importCheckedData_(x, "Chromium", types);
        continue;
      }
      if(y.includes("Opera"))
      {
        this.importCheckedData_(x, "Opera", types);
        continue;
      }
      if(y.includes("Edge"))
      {
        this.importCheckedData_(x, "Edge", types);
        continue;
      }
      if(y.includes("Brave"))
      {
        this.importCheckedData_(x, "Brave", types);
        continue;
      }
      if(y.includes("Explorer"))
      {
        this.importCheckedData_(x, "Explorer", types);
        continue;
      }
      if(y.includes("Safari"))
      {
        this.importCheckedData_(x, "Safari", types);
        continue;
      }
    }
  },

  isImportFromFileSelected_() {
    // The last entry in |browserProfiles_| always refers to dummy profile for
    // importing from a bookmarks file.
    return this.selected_.index == this.browserProfiles_.length - 1;
  },

  shouldDisableImport_() {
    return this.hasImportStatus_(ImportDataStatus.IN_PROGRESS) ||
        this.noImportDataTypeSelected_;
  },

});
