// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'breeze://resources/cr_elements/cr_toast/cr_toast.js';
import 'breeze://resources/cr_elements/cr_view_manager/cr_view_manager.js';
import 'breeze://resources/cr_elements/hidden_style_css.m.js';
import './google_apps/nux_google_apps.js';
import './landing_view.js';
import './ntp_background/nux_ntp_background.js';
import './set_as_default/nux_set_as_default.js';
import './signin_view.js';
import '../strings.m.js';

import {CrViewManagerElement} from 'breeze://resources/cr_elements/cr_view_manager/cr_view_manager.js';
import {assert} from 'breeze://resources/js/assert.m.js';
import {loadTimeData} from 'breeze://resources/js/load_time_data.m.js';
import {html, PolymerElement} from 'breeze://resources/polymer/v3_0/polymer/polymer_bundled.min.js';

import {NavigationMixin, Routes} from './navigation_mixin.js';
import {NuxSetAsDefaultProxyImpl, NuxSetAsDefaultProxy} from './set_as_default/nux_set_as_default_proxy.js';
import {BookmarkBarManager} from './shared/bookmark_proxy.js';
import {WelcomeBrowserProxyImpl} from './welcome_browser_proxy.js';

import {ImportDataBrowserProxyImpl, ImportDataBrowserProxy, BrowserProfile} from './import_data_browser_proxy.js';
import {SearchEngine, SearchEnginesInfo, SearchEnginesBrowserProxyImpl} from './search_engines_browser_proxy.js';
import {addWebUIListener} from 'breeze://resources/js/cr.m.js';

/**
 * The strings contained in the arrays should be valid DOM-element tag names.
 */
type NuxOnboardingModules = {
  'new-user': string[],
  'returning-user': string[]
};

/**
 * This list needs to be updated if new modules need to be supported in the
 * onboarding flow.
 */
const MODULES_WHITELIST: Set<string> = new Set([
  'nux-google-apps', 'nux-ntp-background', 'nux-set-as-default', 'signin-view'
]);

/**
 * This list needs to be updated if new modules that need step-indicators are
 * added.
 */
const MODULES_NEEDING_INDICATOR: Set<string> =
    new Set(['nux-google-apps', 'nux-ntp-background', 'nux-set-as-default']);

export interface WelcomeAppElement {
  $: {
    viewManager: CrViewManagerElement,
  };
}

const WelcomeAppElementBase = NavigationMixin(PolymerElement);

/** @polymer */
export class WelcomeAppElement extends WelcomeAppElementBase {
  static get is() {
    return 'welcome-app';
  }

  static get properties() {
    return {
      modulesInitialized_: Boolean,
    };
  }
  private currentRoute_: Routes|null = null;
  private modules_: NuxOnboardingModules;

  // Default to false so view-manager is hidden until views are
  // initialized.
  private modulesInitialized_: boolean = false;
  private browserProxy_: ImportDataBrowserProxy|null = null;
  private browserProfiles_:BrowserProfile[]|undefined;
  private selected_:BrowserProfile|undefined;
  private searchEngines_: Array<SearchEngine> = [];
  private enginesProxy_:SearchEnginesBrowserProxyImpl = 
                        SearchEnginesBrowserProxyImpl.getInstance();
  private setAsDefaultProxy_:NuxSetAsDefaultProxy = NuxSetAsDefaultProxyImpl.getInstance();
  private finalized_:boolean = false;

  constructor() {
    super();
    this.modules_ = {
      'new-user': loadTimeData.getString('newUserModules').split(','),
      'returning-user':
          loadTimeData.getString('returningUserModules').split(',')
    };
  }

  ready() {
    super.ready();

    //Updating right side dots dynamically
    const dotsStorage = sessionStorage.getItem("dotsStorage");
    if(dotsStorage === null) {
      this.shadowRoot!.querySelector(".dot.page1")!.classList.add('active');
      this.rippleTimeout(1200);
    }
    else {
      this.shadowRoot!.querySelector(".dot."+dotsStorage)!.classList.add('active');
    }

    // Import from other browsers
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

    const updateSearchEngines = (searchEngines: SearchEnginesInfo) => {
      this.set('searchEngines_', searchEngines.defaults);
    };
    this.enginesProxy_.getSearchEnginesList().then(updateSearchEngines);
    addWebUIListener('search-engines-changed', updateSearchEngines);

    this.setAttribute('role', 'main');
    addWebUIListener(
        'browser-default-state-changed',
        this.onDefaultBrowserChange_.bind(this));
    // this.addEventListener(
    //   'default-browser-change', () => this.onDefaultBrowserChange_(this));
  }

  private rippleTimeout(delay:number, itr = 2) {
    let that = this;
    setTimeout(function(){ that.ripple(itr); }, delay);
  }

  private ripple(iterations:number){
    let elements = this.shadowRoot!.querySelectorAll<HTMLElement>('.arrow-ripple');
    elements.forEach(elm => {
      elm.style.animation = "ripple 700ms linear " + iterations;
      let newelm = elm.cloneNode(true);
      elm.parentNode!.replaceChild(newelm, elm);
    })
  }

  private smoothScroll_(e:Event) {
    let sectionId =  (e.currentTarget as HTMLElement).getAttribute('section-id');
    this.shadowRoot!.querySelector(`#${sectionId}`)!.scrollIntoView({
      behavior: 'smooth',
      block: "end",
      inline: "nearest"
    });
    this.handlePageChange_(sectionId);
  }

  private toggleCheckbox_(e:Event) {
    (e.currentTarget as HTMLElement).classList.toggle('checked');

    // blue indicator thingy
    let button = (e.currentTarget as HTMLElement)!.parentElement!.parentElement!.parentElement;
    let numOfTogglesChecked = button!.querySelectorAll('.checked').length;
    if (numOfTogglesChecked == 0){
      button!.classList.remove('checked');
    }
    else if (numOfTogglesChecked == 1)
    {
      button!.classList.add('checked');
    }
  }

  private toggleRadio_(e:Event) {
    let picked = (e.currentTarget as HTMLElement);
    picked!.parentElement!.childNodes.forEach((node:ChildNode) =>{
      (<Element>node).classList.remove('active');
    });
    picked.classList.add('active');
  }

  private setDefaultEngine_(e:Event) {
    const engineID = (e.currentTarget as HTMLElement).getAttribute("id");
    if(!engineID) {
      return;
    }
    this.enginesProxy_.setDefaultSearchEngine(this.findIndexOfEngine_(engineID));
    this.toggleRadio_(e);
    this.rippleTimeout(200);
  }

  private findIndexOfEngine_(target:string|null)
  {
    for(let engine of this.searchEngines_)
    {
      if(engine.name == target)
      {
        return engine.modelIndex;
      }
    }
    return 0;
  }

  private importFromBrowser_() {
    if(!this.browserProfiles_)
    {
      return;
    }
    for(let x of this.browserProfiles_)
    {
      let types:{[type: string]: boolean} = {
        'import_dialog_history': false,
        'import_dialog_bookmarks': false,
        'import_dialog_saved_passwords': false,
        'import_dialog_search_engine': false,
        'import_dialog_autofill_form_data': false,
  };
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
  }

  importCheckedData_(browserObject:BrowserProfile, browserName:string, types:{[type: string]: boolean}) {
    let slideButton = this.shadowRoot!.querySelector(`#${browserName}`);
    slideButton!.querySelectorAll(".checked").forEach(node =>{
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
    this.browserProxy_!.importData(browserObject.index, types);
    slideButton!.classList.add('done')
  }

  private handlePageChange_(targetPage:string|null){
    let temp:string;
    if(!targetPage)
    {
      return;
    }
    temp = targetPage || "0";
    let currentPage = this.shadowRoot!.querySelector(".dot.active")!.classList[1];
    if (currentPage !== targetPage) {
      switch (currentPage) {
        case "page2":
          this.importFromBrowser_();
          break;
      }
    }
    this.shadowRoot!.querySelector(".dot.active")!.classList.remove('active');
    sessionStorage!.setItem("dotsStorage", targetPage);
    this.shadowRoot!.querySelector(".dot."+targetPage)!.classList.add('active');
    switch(targetPage)
    {
      case "page1":
        this.rippleTimeout(1200);
        break;
      case "page5":
        this.rippleTimeout(800);
        break;
    }
  }

  private rippleOut_(e:Event) {
    if ((e.currentTarget as HTMLElement)!.querySelectorAll('.checked').length)
    //(getComputedStyle((e.currentTarget as HTMLElement)!.querySelector('.tick')).fontSize != "50px"))
      this.rippleTimeout(100,2);
  }

  private onlyShowAvailable_(browserObject:BrowserProfile, browserClassName:string) {
    let slideButton = this.shadowRoot!.querySelector(`#${browserClassName}`);
    slideButton!.classList.remove('hidden');


    let checkboxes = slideButton!.querySelectorAll('p');
    if(browserObject.favorites)
    {
      checkboxes[0]!.classList.remove('hidden');
    }
    if(browserObject.history)
    {
      checkboxes[1]!.classList.remove('hidden');
    }
    if(browserObject.passwords)
    {
      checkboxes[2]!.classList.remove('hidden');
    }
    if(browserObject.search)
    {
      checkboxes[3]!.classList.remove('hidden');
    }
    if(browserObject.autofillFormData)
    {
      checkboxes[4]!.classList.remove('hidden');
    }
  }

  private onDefaultBrowserChange_(status:any) {
    if (status.isDefault) {
      this.setAsDefaultProxy_.recordSuccessfullySetDefault();
      this.finished_();
      return;
    }

    window.setTimeout(() => {
      this.setAsDefaultProxy_.requestDefaultBrowserState().then(
          this.onDefaultBrowserChange_.bind(this));
    }, 100);
  }

  private finished_() {
    this.finalized_ = true;
    this.scrollToDivID_("page5");
  }

  private onDeclineClick_() {
    if (this.finalized_) {
      return;
    }

    this.setAsDefaultProxy_.recordSkip();
    this.finished_();
  }

  private onSetDefaultClick_() {
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
  }

  private scrollToDivID_(divName:string) {
    let sectionId = divName;
    this.shadowRoot!.querySelector(`#${sectionId}`)!.scrollIntoView({
      behavior: 'smooth',
      block: "end",
      inline: "nearest"
    });
    this.handlePageChange_(sectionId);
  }

  goToNewTabPage_() {
    sessionStorage.setItem("dotsStorage", "page1");
    window.location.replace('breeze://newtab');
  }

  onRouteChange(route: Routes, step: number) {
    const setStep = () => {
      // If the specified step doesn't exist, that means there are no more
      // steps. In that case, replace this page with NTP.
      if (!this.shadowRoot!.querySelector(`#step-${step}`)) {
        WelcomeBrowserProxyImpl.getInstance().goToNewTabPage(
            /* replace */ true);
      } else {  // Otherwise, go to the chosen step of that route.
        // At this point, views are ready to be shown.
        this.modulesInitialized_ = true;
        this.$.viewManager.switchView(
            `step-${step}`, 'fade-in', 'no-animation');
      }
    };

    // If the route changed, initialize the steps of modules for that route.
    // if (this.currentRoute_ !== route) {
    //   this.initializeModules(route).then(setStep);
    // } else {
    //   setStep();
    // }

    this.currentRoute_ = route;
  }

  initializeModules(route: Routes) {
    // Remove all views except landing.
    this.$.viewManager
        .querySelectorAll('[slot="view"]:not([id="step-landing"])')
        .forEach(element => element.remove());

    // If it is on landing route, end here.
    if (route === Routes.LANDING) {
      return Promise.resolve();
    }

    let modules = this.modules_[route];
    assert(modules);  // Modules should be defined if on a valid route.
    const defaultBrowserPromise =
        NuxSetAsDefaultProxyImpl.getInstance()
            .requestDefaultBrowserState()
            .then((status) => {
              if (status.isDefault || !status.canBeDefault) {
                return false;
              } else if (!status.isDisabledByPolicy && !status.isUnknownError) {
                return true;
              } else {  // Unknown error.
                return false;
              }
            });

    // Wait until the default-browser state and bookmark visibility are known
    // before anything initializes.
    return Promise
        .all([
          defaultBrowserPromise,
          BookmarkBarManager.getInstance().initialized,
        ])
        .then(([canSetDefault]) => {
          modules = modules.filter(module => {
            if (module === 'nux-set-as-default') {
              return canSetDefault;
            }

            if (!MODULES_WHITELIST.has(module)) {
              // Makes sure the module specified by the feature configuration is
              // whitelisted.
              return false;
            }

            return true;
          });

          const indicatorElementCount = modules.reduce((count, module) => {
            return count += MODULES_NEEDING_INDICATOR.has(module) ? 1 : 0;
          }, 0);

          let indicatorActiveCount = 0;
          modules.forEach((elementTagName, index) => {
            const element =
                document.createElement(elementTagName) as PolymerElement;
            element.id = 'step-' + (index + 1);
            element.setAttribute('slot', 'view');
            this.$.viewManager.appendChild(element);
            if (MODULES_NEEDING_INDICATOR.has(elementTagName)) {
              element.set('indicatorModel', {
                total: indicatorElementCount,
                active: indicatorActiveCount++
              });
            }
          });
        });
  }

  static get template() {
    return html`{__html_template__}`;
  }
}
customElements.define(WelcomeAppElement.is, WelcomeAppElement);
