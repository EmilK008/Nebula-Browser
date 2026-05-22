(() => {
  const HOME_FILE = "welcome.html";
  const BOOKMARKS_LEGACY_V2 = "nebula-bookmarks-v2";

  function bookmarksStorageKey() {
    return `nebula-bookmarks-v2-${sanitizeProfileIdForSession(appSettings.activeProfileId)}`;
  }
  const HISTORY_LEGACY_V1 = "nebula-history-v1";

  function historyStorageKey() {
    return `nebula-history-v2-${sanitizeProfileIdForSession(appSettings.activeProfileId)}`;
  }
  const SESSION_RESTORE_V1 = "nebula-session-restore-v1";

  function sanitizeProfileIdForSession(raw) {
    let s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!s || s === "default") return "default";
    s = s.replace(/[^a-z0-9_-]/g, "").slice(0, 48);
    return s || "default";
  }

  function sessionRestoreStorageKey() {
    return `nebula-session-restore-v2-${sanitizeProfileIdForSession(appSettings.activeProfileId)}`;
  }

  function aiConversationsStorageKey() {
    return `nebula-ai-conversations-v1-${sanitizeProfileIdForSession(appSettings.activeProfileId)}`;
  }

  const PASSWORD_SAVE_DENY_KEY = "nebula-password-save-deny-origins-v1";
  const SESSION_VAULT_DENY_KEY = "nebula-session-vault-deny-origins-v1";
  const HISTORY_MAX = 3000;
  const CLOSED_MAX = 25;

  /** Guest page: selection + input/textarea selection (trimmed). */
  const READ_SELECTION_JS = `(function(){
    try {
      var t = "";
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString) t = sel.toString() || "";
      if (t && t.trim().length > 0) return t.trim();
      var ae = document.activeElement;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA") && typeof ae.selectionStart === "number") {
        var ins = ae.value != null ? String(ae.value) : "";
        var a = ae.selectionStart | 0, b = ae.selectionEnd | 0;
        if (b > a) {
          var slice = ins.substring(a, b);
          if (slice && slice.trim().length > 0) return slice.trim();
        }
      }
    } catch (err) {}
    return "";
  })()`;

  const READ_ALOUD_MAX_CHARS = 32000;

  const TRANSLATE_LANG_OPTIONS = [
    { code: "en", label: "English" },
    { code: "es", label: "Spanish" },
    { code: "de", label: "German" },
    { code: "fr", label: "French" },
    { code: "it", label: "Italian" },
    { code: "pt", label: "Portuguese" },
    { code: "ru", label: "Russian" },
    { code: "ja", label: "Japanese" },
    { code: "ko", label: "Korean" },
    { code: "zh-CN", label: "Chinese (Simplified)" },
    { code: "zh-TW", label: "Chinese (Traditional)" },
    { code: "ar", label: "Arabic" },
    { code: "hi", label: "Hindi" },
    { code: "nl", label: "Dutch" },
    { code: "pl", label: "Polish" },
    { code: "sv", label: "Swedish" },
    { code: "tr", label: "Turkish" },
    { code: "vi", label: "Vietnamese" },
    { code: "th", label: "Thai" },
    { code: "id", label: "Indonesian" },
    { code: "uk", label: "Ukrainian" },
    { code: "cs", label: "Czech" },
    { code: "da", label: "Danish" },
    { code: "fi", label: "Finnish" },
    { code: "no", label: "Norwegian" },
    { code: "he", label: "Hebrew" },
    { code: "ro", label: "Romanian" },
    { code: "hu", label: "Hungarian" },
    { code: "el", label: "Greek" },
    { code: "ms", label: "Malay" },
    { code: "fil", label: "Filipino" },
    { code: "bn", label: "Bengali" },
    { code: "ta", label: "Tamil" },
    { code: "sw", label: "Swahili" },
  ];

  const INPAGE_TRANSLATE_COLLECT_JS = `(function(){
    function skip(name){
      var u=(name||"").toUpperCase();
      return u==="SCRIPT"||u==="STYLE"||u==="NOSCRIPT"||u==="SVG"||u==="CODE"||u==="PRE"||u==="TEXTAREA";
    }
    function visit(node,arr){
      if(!node)return;
      if(node.nodeType===3){
        var p=node.parentElement;
        if(!p||skip(p.tagName))return;
        var v=node.nodeValue;
        if(!v||!String(v).trim()||String(v).replace(/\\s+/g,"").length<2)return;
        arr.push(v);
        return;
      }
      if(node.nodeType===1){
        var el=node;
        if(el.shadowRoot)visit(el.shadowRoot,arr);
        for(var c=el.firstChild;c;c=c.nextSibling)visit(c,arr);
      }
      if(node.nodeType===11){
        for(var k=0;k<node.childNodes.length;k++)visit(node.childNodes[k],arr);
      }
    }
    var all=[];
    visit(document.documentElement,all);
    var strings=[],total=0,MAXN=300,MAXC=42000;
    for(var i=0;i<all.length&&strings.length<MAXN&&total<MAXC;i++){
      var s=all[i];
      if(total+s.length>MAXC)break;
      strings.push(s);total+=s.length;
    }
    try{sessionStorage.setItem("nebulaTrOrig",JSON.stringify(strings));}catch(e){}
    return strings;
  })()`;

  const INPAGE_TRANSLATE_REVERT_JS = `(function(){
    try{
      if(typeof window.__nebulaTrTeardown==='function'){try{window.__nebulaTrTeardown();}catch(e0){}}
      var raw=sessionStorage.getItem("nebulaTrOrig");
      if(!raw)return false;
      var orig=JSON.parse(raw);
      if(!Array.isArray(orig))orig=[];
      function skip(name){
        var u=(name||"").toUpperCase();
        return u==="SCRIPT"||u==="STYLE"||u==="NOSCRIPT"||u==="SVG"||u==="CODE"||u==="PRE"||u==="TEXTAREA";
      }
      function walk(node){
        if(!node)return;
        if(node.nodeType===3){
          var p=node.parentElement;
          if(!p||skip(p.tagName))return;
          var v=node.nodeValue;
          if(!v||!String(v).trim()||String(v).replace(/\\s+/g,"").length<2)return;
          var ri=node.__nebulaTrOrigIdx;
          if(typeof ri==="number"&&ri>=0&&ri<orig.length&&orig[ri]!=null){
            node.nodeValue=String(orig[ri]);
            try{delete node.__nebulaTrOrigIdx;}catch(e1){}
            return;
          }
          if(typeof node.__nebulaTrSrc==="string"){
            node.nodeValue=node.__nebulaTrSrc;
            try{delete node.__nebulaTrSrc;}catch(e2){}
            return;
          }
          return;
        }
        if(node.nodeType===1){
          var el=node;
          if(el.shadowRoot)walk(el.shadowRoot);
          for(var c=el.firstChild;c;c=c.nextSibling)walk(c);
        }
        if(node.nodeType===11){
          for(var k=0;k<node.childNodes.length;k++)walk(node.childNodes[k]);
        }
      }
      walk(document.documentElement);
      sessionStorage.removeItem("nebulaTrOrig");
      return true;
    }catch(e){return false;}
  })()`;

  function buildInpageTranslateApplyJs(translated) {
    const inner = JSON.stringify(translated);
    return `(function(){try{var trans=JSON.parse(${JSON.stringify(inner)});function skip(name){var u=(name||"").toUpperCase();return u==="SCRIPT"||u==="STYLE"||u==="NOSCRIPT"||u==="SVG"||u==="CODE"||u==="PRE"||u==="TEXTAREA";}var idx=0;function walk(node){if(!node)return;if(node.nodeType===3){var p=node.parentElement;if(!p||skip(p.tagName))return;var v=node.nodeValue;if(!v||!String(v).trim()||String(v).replace(/\\s+/g,"").length<2)return;if(idx<trans.length){node.__nebulaTrOrigIdx=idx;node.nodeValue=trans[idx];idx++;}return;}if(node.nodeType===1){var el=node;if(el.shadowRoot)walk(el.shadowRoot);for(var c=el.firstChild;c;c=c.nextSibling)walk(c);}if(node.nodeType===11){for(var k=0;k<node.childNodes.length;k++)walk(node.childNodes[k]);}}walk(document.documentElement);return true;}catch(e){return false;}})()`;
  }

  function buildInpageTranslateIncrementalApplyJs(pairs) {
    const inner = JSON.stringify(pairs);
    return `(function(){try{if(typeof window.__nebulaTrApplyIncremental!=="function")return false;var pairs=JSON.parse(${JSON.stringify(inner)});window.__nebulaTrApplyIncremental(pairs);return true;}catch(e){return false}})()`;
  }

  const INPAGE_TRANSLATE_INSTALL_AUTO_JS = `(function(){
    try{
      if(typeof window.__nebulaTrTeardown==='function'){try{window.__nebulaTrTeardown();}catch(e0){}}
      var handled=new WeakSet();
      var nodeById=new Map();
      var nextId=1;
      var exportQueue=[];
      var deb=null;
      var obs=null;
      window.__nebulaTrApplying=false;
      window.__nebulaTrAuto=true;
      function skip(name){
        var u=(name||"").toUpperCase();
        return u==="SCRIPT"||u==="STYLE"||u==="NOSCRIPT"||u==="SVG"||u==="CODE"||u==="PRE"||u==="TEXTAREA";
      }
      function visitMark(root){
        function v(node){
          if(!node)return;
          if(node.nodeType===3){
            var p=node.parentElement;
            if(!p||skip(p.tagName))return;
            var val=node.nodeValue;
            if(val&&String(val).trim()&&String(val).replace(/\\s+/g,"").length>=2)handled.add(node);
            return;
          }
          if(node.nodeType===1){
            var el=node;
            if(el.shadowRoot)visitMark(el.shadowRoot);
            for(var c=el.firstChild;c;c=c.nextSibling)v(c);
          }
          if(node.nodeType===11){
            for(var k=0;k<node.childNodes.length;k++)v(node.childNodes[k]);
          }
        }
        v(root);
      }
      visitMark(document.documentElement);
      function scanNew(){
        if(!window.__nebulaTrAuto||window.__nebulaTrApplying)return;
        function walk(node){
          if(!node)return;
          if(node.nodeType===3){
            var p=node.parentElement;
            if(!p||skip(p.tagName))return;
            if(handled.has(node))return;
            var val=node.nodeValue;
            if(!val||!String(val).trim()||String(val).replace(/\\s+/g,"").length<2)return;
            try{node.__nebulaTrSrc=val;}catch(e2){}
            var id=nextId++;
            nodeById.set(id,node);
            exportQueue.push({id:id,text:val});
            handled.add(node);
            return;
          }
          if(node.nodeType===1){
            var el=node;
            if(el.shadowRoot)walk(el.shadowRoot);
            for(var c=el.firstChild;c;c=c.nextSibling)walk(c);
          }
          if(node.nodeType===11){
            for(var k=0;k<node.childNodes.length;k++)walk(node.childNodes[k]);
          }
        }
        walk(document.documentElement);
      }
      function onMut(){
        if(!window.__nebulaTrAuto||window.__nebulaTrApplying)return;
        if(deb)clearTimeout(deb);
        deb=setTimeout(function(){
          deb=null;
          scanNew();
        },420);
      }
      obs=new MutationObserver(onMut);
      obs.observe(document.documentElement,{subtree:true,childList:true,characterData:false});
      setTimeout(function(){scanNew();},0);
      window.__nebulaTrDrainQueue=function(){
        if(!exportQueue.length)return"[]";
        var n=Math.min(80,exportQueue.length);
        var chunk=exportQueue.splice(0,n);
        return JSON.stringify(chunk);
      };
      window.__nebulaTrApplyIncremental=function(pairs){
        window.__nebulaTrApplying=true;
        try{
          for(var i=0;i<pairs.length;i++){
            var p=pairs[i];
            var node=nodeById.get(p.id);
            if(node&&node.parentNode!=null)node.nodeValue=p.t;
            nodeById.delete(p.id);
          }
        }finally{
          window.__nebulaTrApplying=false;
        }
      };
      window.__nebulaTrTeardown=function(){
        window.__nebulaTrAuto=false;
        if(deb){clearTimeout(deb);deb=null;}
        if(obs){try{obs.disconnect();}catch(e1){}obs=null;}
        exportQueue.length=0;
        nodeById.clear();
        window.__nebulaTrDrainQueue=null;
        window.__nebulaTrApplyIncremental=null;
        window.__nebulaTrTeardown=null;
      };
      return true;
    }catch(err){return false;}
  })()`;

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 1.12;

  const tabsStrip = document.getElementById("tabs-strip");
  const tabCtxMenu = document.getElementById("tab-ctx-menu");
  const tabGroupRenamePanel = document.getElementById("tab-group-rename-panel");
  const tabGroupRenameBackdrop = document.getElementById("tab-group-rename-backdrop");
  const tabGroupRenameInput = document.getElementById("tab-group-rename-input");
  const tabGroupRenameColor = document.getElementById("tab-group-rename-color");
  const tabGroupRenameSwatches = document.getElementById("tab-group-rename-swatches");
  const tabGroupRenameSave = document.getElementById("tab-group-rename-save");
  const tabGroupRenameCancel = document.getElementById("tab-group-rename-cancel");
  const stack = document.getElementById("webview-stack");
  const contentMain = stack ? stack.parentElement : null;
  const urlInput = document.getElementById("url-input");
  const form = document.querySelector(".omnibox-wrap");
  const btnBack = document.getElementById("btn-back");
  const btnForward = document.getElementById("btn-forward");
  const btnReload = document.getElementById("btn-reload");
  const btnHome = document.getElementById("btn-home");
  const btnNewTab = document.getElementById("btn-new-tab");
  const btnNewTabStrip = document.getElementById("btn-new-tab-strip");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const btnBookmark = document.getElementById("btn-bookmark");
  const bookmarksBar = document.getElementById("bookmarks-bar");
  const findBar = document.getElementById("find-bar");
  const findInput = document.getElementById("find-input");
  const findStatus = document.getElementById("find-status");
  const findPrevBtn = document.getElementById("find-prev");
  const findNextBtn = document.getElementById("find-next");
  const findCloseBtn = document.getElementById("find-close");
  const downloadsDock = document.getElementById("downloads-dock");
  const omniboxEl = document.querySelector(".omnibox");
  const omniboxSuggestions = document.getElementById("omnibox-suggestions");
  const historyPanel = document.getElementById("history-panel");
  const historyPanelBackdrop = document.getElementById("history-panel-backdrop");
  const historyPanelClose = document.getElementById("history-panel-close");
  const historyClearBtn = document.getElementById("history-clear");
  const historyListEl = document.getElementById("history-list");
  const sessionRestorePanel = document.getElementById("session-restore-panel");
  const sessionRestoreBackdrop = document.getElementById("session-restore-backdrop");
  const sessionRestoreYes = document.getElementById("session-restore-yes");
  const sessionRestoreNo = document.getElementById("session-restore-no");
  const sessionRestoreDesc = document.getElementById("session-restore-desc");
  const firstRunPanel = document.getElementById("first-run-panel");
  const firstRunBackdrop = document.getElementById("first-run-backdrop");
  const firstRunStepLabel = document.getElementById("first-run-step-label");
  const firstRunStep1 = document.getElementById("first-run-step-1");
  const firstRunStep2 = document.getElementById("first-run-step-2");
  const firstRunStep3 = document.getElementById("first-run-step-3");
  const firstRunMsg = document.getElementById("first-run-msg");
  const firstRunAccountForm = document.getElementById("first-run-account-form");
  const firstRunAccountSkipHint = document.getElementById("first-run-account-skip-hint");
  const firstRunSkipAll = document.getElementById("first-run-skip-all");
  const firstRunStep1Next = document.getElementById("first-run-step1-next");
  const firstRunStep2Back = document.getElementById("first-run-step2-back");
  const firstRunStep2Next = document.getElementById("first-run-step2-next");
  const firstRunStep2Skip = document.getElementById("first-run-step2-skip");
  const firstRunImportChrome = document.getElementById("first-run-import-chrome");
  const firstRunImportEdge = document.getElementById("first-run-import-edge");
  const firstRunImportFirefox = document.getElementById("first-run-import-firefox");
  const firstRunStep3Back = document.getElementById("first-run-step3-back");
  const firstRunStep3Next = document.getElementById("first-run-step3-next");
  const firstRunStep3Skip = document.getElementById("first-run-step3-skip");
  const firstRunAccountPass = document.getElementById("first-run-account-pass");
  const firstRunAccountPass2 = document.getElementById("first-run-account-pass2");
  const firstRunAccountCreate = document.getElementById("first-run-account-create");
  const sitePermPanel = document.getElementById("site-perm-panel");
  const sitePermBackdrop = document.getElementById("site-perm-backdrop");
  const sitePermClose = document.getElementById("site-perm-close");
  const btnSitePerm = document.getElementById("btn-site-perm");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsPanelBackdrop = document.getElementById("settings-panel-backdrop");
  const settingsPanelClose = document.getElementById("settings-panel-close");
  const settingsSaveBtn = document.getElementById("settings-save");
  const settingsProfileSelect = document.getElementById("settings-profile-select");
  const settingsProfileAdd = document.getElementById("settings-profile-add");
  const settingsProfileRemove = document.getElementById("settings-profile-remove");
  const settingsProfileAddPanel = document.getElementById("settings-profile-add-panel");
  const settingsProfileNewName = document.getElementById("settings-profile-new-name");
  const settingsProfileAddConfirm = document.getElementById("settings-profile-add-confirm");
  const settingsProfileAddCancel = document.getElementById("settings-profile-add-cancel");
  const btnSettings = document.getElementById("btn-settings");
  const settingsBookmarksImportSource = document.getElementById("settings-bookmarks-import-source");
  const settingsBookmarksImportMerge = document.getElementById("settings-bookmarks-import-merge");
  const settingsBookmarksImportReplace = document.getElementById("settings-bookmarks-import-replace");
  const settingsBookmarksExportHtml = document.getElementById("settings-bookmarks-export-html");
  const settingsBookmarksExportJson = document.getElementById("settings-bookmarks-export-json");
  const settingsOpenChangelog = document.getElementById("settings-open-changelog");
  const settingsCheckUpdates = document.getElementById("settings-check-updates");
  const settingsUpdateHint = document.getElementById("settings-update-hint");
  const settingsOpenEvsDocs = document.getElementById("settings-open-evs-docs");
  const updateBanner = document.getElementById("update-banner");
  const updateBannerText = document.getElementById("update-banner-text");
  const updateBannerDownload = document.getElementById("update-banner-download");
  const updateBannerDismiss = document.getElementById("update-banner-dismiss");
  const changelogPanel = document.getElementById("changelog-panel");
  const changelogPanelBackdrop = document.getElementById("changelog-panel-backdrop");
  const changelogPanelClose = document.getElementById("changelog-panel-close");
  const changelogPanelBody = document.getElementById("changelog-panel-body");
  const permissionPromptPanel = document.getElementById("permission-prompt-panel");
  const permissionPromptBackdrop = document.getElementById("permission-prompt-backdrop");
  const permissionPromptMessage = document.getElementById("permission-prompt-message");
  const permissionPromptRemember = document.getElementById("permission-prompt-remember");
  const permissionPromptAllow = document.getElementById("permission-prompt-allow");
  const permissionPromptBlock = document.getElementById("permission-prompt-block");
  const passwordSaveOfferPanel = document.getElementById("password-save-offer-panel");
  const passwordSaveOfferBackdrop = document.getElementById("password-save-offer-backdrop");
  const passwordSaveOfferMessage = document.getElementById("password-save-offer-message");
  const passwordSaveOfferSave = document.getElementById("password-save-offer-save");
  const passwordSaveOfferDismiss = document.getElementById("password-save-offer-dismiss");
  const passwordSaveOfferNever = document.getElementById("password-save-offer-never");
  const passwordSaveOfferTitle = document.getElementById("password-save-offer-title");
  const vaultPanel = document.getElementById("vault-panel");
  const vaultPanelBackdrop = document.getElementById("vault-panel-backdrop");
  const vaultPanelClose = document.getElementById("vault-panel-close");
  const vaultListEl = document.getElementById("vault-list");
  const vaultSearchInput = document.getElementById("vault-search");
  const vaultAddToggle = document.getElementById("vault-add-toggle");
  const vaultFormWrap = document.getElementById("vault-form-wrap");
  const vaultEditId = document.getElementById("vault-edit-id");
  const vaultFieldUrl = document.getElementById("vault-field-url");
  const vaultFieldTitle = document.getElementById("vault-field-title");
  const vaultFieldUser = document.getElementById("vault-field-user");
  const vaultFieldPass = document.getElementById("vault-field-pass");
  const vaultFieldNotes = document.getElementById("vault-field-notes");
  const vaultFormSave = document.getElementById("vault-form-save");
  const vaultFormCancel = document.getElementById("vault-form-cancel");
  const vaultHintEncryption = document.getElementById("vault-hint-encryption");
  const settingsOpenVault = document.getElementById("settings-open-vault");
  const vaultFilter = document.getElementById("vault-filter");
  const vaultExportBtn = document.getElementById("vault-export-btn");
  const vaultExportIncludePasswords = document.getElementById("vault-export-include-passwords");
  const vaultImportBtn = document.getElementById("vault-import-btn");
  const vaultImportMode = document.getElementById("vault-import-mode");
  const vaultUnlockOverlay = document.getElementById("vault-unlock-overlay");
  const vaultUnlockPass = document.getElementById("vault-unlock-pass");
  const vaultUnlockError = document.getElementById("vault-unlock-error");
  const vaultUnlockSubmit = document.getElementById("vault-unlock-submit");
  const vaultLockBtn = document.getElementById("vault-lock-btn");
  const nebulaAccountCreateBlock = document.getElementById("nebula-account-create-block");
  const nebulaAccountManageBlock = document.getElementById("nebula-account-manage-block");
  const nebulaAccountNewPass = document.getElementById("nebula-account-new-pass");
  const nebulaAccountConfirmPass = document.getElementById("nebula-account-confirm-pass");
  const nebulaAccountCreateBtn = document.getElementById("nebula-account-create-btn");
  const nebulaAccountCurrentPass = document.getElementById("nebula-account-current-pass");
  const nebulaAccountChangeNewPass = document.getElementById("nebula-account-change-new-pass");
  const nebulaAccountChangeBtn = document.getElementById("nebula-account-change-btn");
  const nebulaAccountRemoveBtn = document.getElementById("nebula-account-remove-btn");
  const nebulaAccountLockNowBtn = document.getElementById("nebula-account-lock-now-btn");
  const nebulaAccountSettingsMsg = document.getElementById("nebula-account-settings-msg");
  const btnTranslate = document.getElementById("btn-translate");
  const translatePanel = document.getElementById("translate-panel");
  const translatePanelLang = document.getElementById("translate-panel-lang");
  const translatePanelGo = document.getElementById("translate-panel-go");
  const translatePanelOriginal = document.getElementById("translate-panel-original");
  const translateDropdownWrap = document.querySelector(".translate-dropdown-wrap");
  const btnVpn = document.getElementById("btn-vpn");
  const vpnDropdownWrap = document.querySelector(".vpn-dropdown-wrap");
  const vpnPanel = document.getElementById("vpn-panel");
  const vpnPanelProviderList = document.getElementById("vpn-panel-provider-list");
  const vpnPanelOpenApp = document.getElementById("vpn-panel-open-app");
  const vpnPanelDownload = document.getElementById("vpn-panel-download");

  const AI_PRESET_MODELS = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini", "o1-preview"],
    anthropic: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    google: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  };

  const btnAi = document.getElementById("btn-ai");
  const aiToolbarWrap = document.querySelector(".ai-toolbar-wrap");
  const aiDrawer = document.getElementById("ai-drawer");
  const aiDrawerClose = document.getElementById("ai-drawer-close");
  const aiProvider = document.getElementById("ai-provider");
  const aiModel = document.getElementById("ai-model");
  const aiMessagesEl = document.getElementById("ai-messages");
  const aiInput = document.getElementById("ai-input");
  const aiSendBtn = document.getElementById("ai-send-btn");
  const aiSummarizeTabBtn = document.getElementById("ai-summarize-tab-btn");
  const aiClearBtn = document.getElementById("ai-clear-btn");
  const aiAddModelBtn = document.getElementById("ai-add-model-btn");
  const aiAddModelInput = document.getElementById("ai-add-model-input");
  const aiDrawerHint = document.getElementById("ai-drawer-hint");
  const aiConversationSelect = document.getElementById("ai-conversation-select");
  const aiConvNewBtn = document.getElementById("ai-conv-new");
  const aiConvSaveBtn = document.getElementById("ai-conv-save");
  const aiConvDeleteBtn = document.getElementById("ai-conv-delete");
  const aiThinkingRow = document.getElementById("ai-thinking");

  const AI_TAB_AGENT_TEXT_MAX = 12000;
  const AI_TAB_AGENT_LOAD_TIMEOUT_MS = 42000;
  const AI_TAB_AGENT_SETTLE_MS = 500;

  /** @type {{ role: string, content: string }[]} */
  let aiChatMessages = [];
  let aiSendBusy = false;
  /** @type {HTMLElement | null} */
  let aiStreamBubbleEl = null;
  /** @type {string} */
  let activeAiConversationId = "";
  const AI_CONVERSATIONS_STORE_VERSION = 1;
  const AI_CONVERSATIONS_MAX_ITEMS = 48;
  const downloadElById = new Map();

  /** @type {{ id: string, el: Electron.WebviewTag | null, tabEl: HTMLElement, titleEl: HTMLElement, faviconEl: HTMLImageElement, groupId: string | null, guestWcId: number | null, guestPartition: string, isPrivate: boolean, translateBackUrl: string | null, translateInPageActive: boolean, translateInPagePollTimer: number | null, translateInPageTargetLang: string | null, muteBtn: HTMLButtonElement, camBtn: HTMLButtonElement, micBtn: HTMLButtonElement, mediaStrip: HTMLElement, mediaState: { audible: boolean, audioMuted: boolean, camera: boolean, microphone: boolean } }[]} */
  let tabs = [];
  let activeId = null;
  let idSeq = 0;
  /** @type {{ id: string, label: string, color: string, collapsed: boolean }[]} */
  let tabGroups = [];
  let tabGroupSeq = 0;
  /** @type {HTMLElement | null} */
  let tabReorderIndicator = null;
  let tabStripReorderActive = false;
  /** @type {string | null} */
  let tabCtxTargetId = null;
  /** @type {string | null} */
  let tabGroupRenameGid = null;
  /** @type {{ url: string, title: string }[]} */
  let bookmarks = [];
  /** @type {{ url: string, title: string }[]} */
  const closedTabs = [];

  const TAB_DRAG_MIME = "application/x-nebula-tab";
  /** @type {{ leftId: string, rightId: string } | null} */
  let splitPair = null;
  const btnExitSplit = document.getElementById("btn-exit-split");
  const splitDropZones = document.getElementById("split-drop-zones");
  const splitResizer = document.getElementById("split-resizer");
  /** After HTML5 drag on a tab, suppress the synthetic click that follows */
  let suppressTabClickUntil = 0;

  const SPLIT_RATIO_MIN = 15;
  const SPLIT_RATIO_MAX = 85;
  let splitRatioPct = 50;

  let omniboxSuggestTimer = null;
  /** Non-recursive updates when loading site permission form from main */
  let refreshingSitePerm = false;
  /** Until true, tab URLs are not persisted for crash/session restore (startup modal). */
  let sessionPersistenceReady = false;
  let sessionSaveTimer = null;
  /** @type {{ navigateUrl: string, label: string, sub?: string, badge?: string }[]} */
  let omniboxSuggestionRows = [];
  let omniboxSelectedIndex = -1;
  const DEFAULT_APP_TOOLBAR_BUTTONS = {
    home: true,
    bookmark: true,
    sitePerm: true,
    translate: true,
    vpn: true,
    ai: true,
    zoomReset: true,
  };

  const DEFAULT_AI_ASSISTANT_APP = {
    activeProvider: "openai",
    modelByProvider: {
      openai: "gpt-4o-mini",
      anthropic: "claude-3-5-sonnet-20241022",
      google: "gemini-2.0-flash",
    },
    customModelsByProvider: {
      openai: [],
      anthropic: [],
      google: [],
    },
    openaiBaseUrl: "https://api.openai.com/v1",
    webSearchEnabled: false,
    pageFetchEnabled: false,
    tabAgentEnabled: false,
    tabAgentConfirmNavigation: true,
  };

  const DEFAULT_APP_SETTINGS = {
    adblockEnabled: true,
    forceDarkMode: false,
    translateEngine: "google-wrap",
    translateLibreUrl: "https://libretranslate.com",
    activeProfileId: "default",
    profiles: [{ id: "default", name: "Default" }],
    browsingPartition: "persist:nebula",
    incognitoPartition: "nebula-pvt-nebula",
    shellTheme: "dark",
    shellAccent: "#6eb5ff",
    shellDensity: "comfortable",
    bookmarksBarMode: "auto",
    toolbarButtons: { ...DEFAULT_APP_TOOLBAR_BUTTONS },
    newTabButtonPlacement: "both",
    aiAssistant: JSON.parse(JSON.stringify(DEFAULT_AI_ASSISTANT_APP)),
    searchSuggestions: {
      layerOrder: ["past", "local", "remote"],
      enablePastSearch: true,
      enableBookmarks: true,
      enableHistory: true,
      enableDuckDuckGo: true,
      maxTotal: 10,
      maxPastSearch: 6,
      maxBookmarks: 4,
      maxHistory: 4,
      maxDuckDuckGo: 8,
      remoteMinChars: 2,
      debounceMs: 220,
    },
    network: {
      proxy: { mode: "direct", proxyRules: "", proxyBypassRules: "" },
    },
    vpnHelper: {
      selectedProviderId: "none",
      nebulaVpnEnabled: false,
      lastDownloadChoice: "ask",
    },
    /** Omitted in saved files before 1.0; main defaults to `true` so upgrades skip onboarding. */
    firstRunOnboardingDone: true,
  };

  /** Official download pages only; `fixedProxyRules` only if accurate (otherwise Nebula uses system proxy when routing is on). */
  const NEBULA_VPN_HELPER_PROVIDERS = [
    { id: "none", label: "— None —", downloadUrl: "", helpUrl: "", fixedProxyRules: "" },
    {
      id: "mullvad",
      label: "Mullvad VPN",
      downloadUrl: "https://mullvad.net/en/download",
      helpUrl: "https://mullvad.net/help",
      fixedProxyRules: "",
    },
    {
      id: "protonvpn",
      label: "Proton VPN",
      downloadUrl: "https://protonvpn.com/download",
      helpUrl: "https://protonvpn.com/support",
      fixedProxyRules: "",
    },
    {
      id: "nordvpn",
      label: "NordVPN",
      downloadUrl: "https://nordvpn.com/download/",
      helpUrl: "https://support.nordvpn.com/",
      fixedProxyRules: "",
    },
    {
      id: "windscribe",
      label: "Windscribe",
      downloadUrl: "https://windscribe.com/download",
      helpUrl: "https://windscribe.com/support",
      fixedProxyRules: "",
    },
    {
      id: "surfshark",
      label: "Surfshark",
      downloadUrl: "https://surfshark.com/download",
      helpUrl: "https://support.surfshark.com/",
      fixedProxyRules: "",
    },
  ];

  /** @type {typeof DEFAULT_APP_SETTINGS} */
  let appSettings = {
    ...DEFAULT_APP_SETTINGS,
    searchSuggestions: { ...DEFAULT_APP_SETTINGS.searchSuggestions },
    toolbarButtons: { ...DEFAULT_APP_SETTINGS.toolbarButtons },
    aiAssistant: JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS.aiAssistant)),
    network: JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS.network)),
    vpnHelper: JSON.parse(JSON.stringify(DEFAULT_APP_SETTINGS.vpnHelper)),
  };

  function normalizeOpenAiBaseUrlApp(raw) {
    const fallback = DEFAULT_AI_ASSISTANT_APP.openaiBaseUrl;
    const s = typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
    try {
      const u = new URL(s.includes("://") ? s : `https://${s}`);
      if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
      let path = (u.pathname || "").replace(/\/$/, "");
      if (!path.endsWith("/v1")) {
        path = path ? `${path}/v1` : "/v1";
      }
      const out = `${u.origin}${path}`.slice(0, 512);
      return out || fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeAppAiAssistant(src) {
    const provs = ["openai", "anthropic", "google"];
    const raw = src && typeof src === "object" ? src : {};
    let active = typeof raw.activeProvider === "string" ? raw.activeProvider.trim().toLowerCase() : "";
    if (!provs.includes(active)) active = DEFAULT_AI_ASSISTANT_APP.activeProvider;
    const defM = DEFAULT_AI_ASSISTANT_APP.modelByProvider;
    const mergedM = raw.modelByProvider && typeof raw.modelByProvider === "object" ? raw.modelByProvider : {};
    const modelByProvider = { ...defM };
    for (const p of provs) {
      const v = typeof mergedM[p] === "string" ? mergedM[p].trim().slice(0, 128) : "";
      modelByProvider[p] = v || defM[p];
    }
    const rawCmp = raw.customModelsByProvider && typeof raw.customModelsByProvider === "object" ? raw.customModelsByProvider : {};
    const customModelsByProvider = { openai: [], anthropic: [], google: [] };
    const MAX_CUSTOM = 24;
    const MAX_ID_LEN = 128;
    for (const p of provs) {
      const arr = Array.isArray(rawCmp[p]) ? rawCmp[p] : [];
      const seen = new Set();
      const out = [];
      for (const x of arr) {
        if (out.length >= MAX_CUSTOM) break;
        const id = typeof x === "string" ? x.trim().slice(0, MAX_ID_LEN) : "";
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
      }
      customModelsByProvider[p] = out;
    }
    const openaiBaseUrl = normalizeOpenAiBaseUrlApp(
      typeof raw.openaiBaseUrl === "string" ? raw.openaiBaseUrl : DEFAULT_AI_ASSISTANT_APP.openaiBaseUrl
    );
    const webSearchEnabled = raw.webSearchEnabled === true;
    const pageFetchEnabled = raw.pageFetchEnabled === true;
    const tabAgentEnabled = raw.tabAgentEnabled === true;
    const tabAgentConfirmNavigation = raw.tabAgentConfirmNavigation === false ? false : true;
    return {
      activeProvider: active,
      modelByProvider,
      customModelsByProvider,
      openaiBaseUrl,
      webSearchEnabled,
      pageFetchEnabled,
      tabAgentEnabled,
      tabAgentConfirmNavigation,
    };
  }

  function normalizeAppNetwork(raw) {
    const net = raw && typeof raw === "object" ? raw : {};
    const pr = net.proxy && typeof net.proxy === "object" ? net.proxy : {};
    const modes = new Set(["direct", "system", "fixed"]);
    const defP = DEFAULT_APP_SETTINGS.network.proxy;
    let mode = typeof pr.mode === "string" ? pr.mode.trim().toLowerCase() : defP.mode;
    if (!modes.has(mode)) mode = defP.mode;
    const proxyRules = typeof pr.proxyRules === "string" ? pr.proxyRules.trim().slice(0, 2048) : "";
    const proxyBypassRules = typeof pr.proxyBypassRules === "string" ? pr.proxyBypassRules.trim().slice(0, 2048) : "";
    if (mode === "fixed" && !proxyRules) mode = "direct";
    return { proxy: { mode, proxyRules, proxyBypassRules } };
  }

  function normalizeAppVpnHelper(raw) {
    const v = raw && typeof raw === "object" ? raw : {};
    const allowed = new Set(["none", "mullvad", "protonvpn", "nordvpn", "windscribe", "surfshark"]);
    let selectedProviderId = typeof v.selectedProviderId === "string" ? v.selectedProviderId.trim().toLowerCase() : "none";
    if (!allowed.has(selectedProviderId)) selectedProviderId = "none";
    const nebulaVpnEnabled = v.nebulaVpnEnabled === true;
    const ldcRaw = typeof v.lastDownloadChoice === "string" ? v.lastDownloadChoice.trim().toLowerCase() : "ask";
    const lastDownloadChoice = ldcRaw === "nebula" || ldcRaw === "external" ? ldcRaw : "ask";
    return { selectedProviderId, nebulaVpnEnabled, lastDownloadChoice };
  }

  function getVpnHelperSelectedProviderId() {
    return normalizeAppVpnHelper(appSettings.vpnHelper || {}).selectedProviderId;
  }

  function getSearchSettings() {
    return appSettings.searchSuggestions;
  }

  function normalizeAppSettings(raw) {
    const o = raw && typeof raw === "object" ? raw : {};
    const profIn = Array.isArray(o.profiles) ? o.profiles : DEFAULT_APP_SETTINGS.profiles;
    const profiles = [];
    const seen = new Set();
    for (const row of profIn) {
      if (!row || typeof row !== "object") continue;
      let id = typeof row.id === "string" ? row.id.trim().toLowerCase() : "";
      id = id.replace(/[^a-z0-9_-]/g, "").slice(0, 48) || "default";
      if (id === "default") id = "default";
      if (seen.has(id)) continue;
      seen.add(id);
      const name = typeof row.name === "string" && row.name.trim() ? row.name.trim().slice(0, 64) : id;
      profiles.push({ id, name });
    }
    if (!profiles.some((p) => p.id === "default")) {
      profiles.unshift({ id: "default", name: "Default" });
    }
    let activeProfileId =
      typeof o.activeProfileId === "string" ? o.activeProfileId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48) : "";
    if (!activeProfileId) activeProfileId = "default";
    if (!profiles.some((p) => p.id === activeProfileId)) activeProfileId = "default";
    const merged = {
      adblockEnabled: o.adblockEnabled !== false,
      forceDarkMode: o.forceDarkMode === true,
      translateEngine: o.translateEngine === "libre" ? "libre" : "google-wrap",
      translateLibreUrl:
        typeof o.translateLibreUrl === "string" && o.translateLibreUrl.trim()
          ? o.translateLibreUrl.trim().slice(0, 512)
          : DEFAULT_APP_SETTINGS.translateLibreUrl,
      activeProfileId,
      profiles,
      browsingPartition:
        typeof o.browsingPartition === "string" && o.browsingPartition
          ? o.browsingPartition
          : activeProfileId === "default"
            ? "persist:nebula"
            : `persist:nebula-${activeProfileId}`,
      incognitoPartition:
        typeof o.incognitoPartition === "string" && o.incognitoPartition
          ? o.incognitoPartition
          : activeProfileId === "default"
            ? "nebula-pvt-nebula"
            : `nebula-pvt-${activeProfileId}`,
      searchSuggestions: {
        ...DEFAULT_APP_SETTINGS.searchSuggestions,
        ...(o.searchSuggestions && typeof o.searchSuggestions === "object" ? o.searchSuggestions : {}),
      },
      shellTheme: typeof o.shellTheme === "string" ? o.shellTheme : DEFAULT_APP_SETTINGS.shellTheme,
      shellAccent: typeof o.shellAccent === "string" ? o.shellAccent : DEFAULT_APP_SETTINGS.shellAccent,
      shellDensity: o.shellDensity === "compact" ? "compact" : "comfortable",
      bookmarksBarMode: typeof o.bookmarksBarMode === "string" ? o.bookmarksBarMode : DEFAULT_APP_SETTINGS.bookmarksBarMode,
      toolbarButtons: {
        ...DEFAULT_APP_TOOLBAR_BUTTONS,
        ...(o.toolbarButtons && typeof o.toolbarButtons === "object" ? o.toolbarButtons : {}),
      },
      newTabButtonPlacement:
        typeof o.newTabButtonPlacement === "string" ? o.newTabButtonPlacement : DEFAULT_APP_SETTINGS.newTabButtonPlacement,
      aiAssistant: normalizeAppAiAssistant(o.aiAssistant),
      network: normalizeAppNetwork(o.network),
      vpnHelper: normalizeAppVpnHelper(o.vpnHelper),
      firstRunOnboardingDone:
        typeof o.firstRunOnboardingDone === "boolean" ? o.firstRunOnboardingDone : DEFAULT_APP_SETTINGS.firstRunOnboardingDone,
    };
    const ss = merged.searchSuggestions;
    const layers = ["past", "local", "remote"];
    if (
      !Array.isArray(ss.layerOrder) ||
      ss.layerOrder.length !== 3 ||
      !ss.layerOrder.every((x) => layers.includes(x)) ||
      new Set(ss.layerOrder).size !== 3
    ) {
      ss.layerOrder = [...DEFAULT_APP_SETTINGS.searchSuggestions.layerOrder];
    }
    ss.maxTotal = Math.min(25, Math.max(3, Number(ss.maxTotal) || DEFAULT_APP_SETTINGS.searchSuggestions.maxTotal));
    ss.maxPastSearch = Math.min(15, Math.max(0, Number(ss.maxPastSearch) || 0));
    ss.maxBookmarks = Math.min(15, Math.max(0, Number(ss.maxBookmarks) || 0));
    ss.maxHistory = Math.min(15, Math.max(0, Number(ss.maxHistory) || 0));
    ss.maxDuckDuckGo = Math.min(15, Math.max(0, Number(ss.maxDuckDuckGo) || 0));
    ss.remoteMinChars = Math.min(6, Math.max(1, Number(ss.remoteMinChars) || 2));
    ss.debounceMs = Math.min(800, Math.max(80, Number(ss.debounceMs) || 220));
    if (typeof ss.enablePastSearch !== "boolean") ss.enablePastSearch = true;
    if (typeof ss.enableBookmarks !== "boolean") ss.enableBookmarks = true;
    if (typeof ss.enableHistory !== "boolean") ss.enableHistory = true;
    if (typeof ss.enableDuckDuckGo !== "boolean") ss.enableDuckDuckGo = true;
    const themes = new Set(["dark", "light", "system"]);
    merged.shellTheme = themes.has(merged.shellTheme) ? merged.shellTheme : DEFAULT_APP_SETTINGS.shellTheme;
    const ac = typeof merged.shellAccent === "string" ? merged.shellAccent.trim() : "";
    merged.shellAccent = /^#[0-9a-fA-F]{6}$/.test(ac) ? ac.toLowerCase() : DEFAULT_APP_SETTINGS.shellAccent;
    merged.shellDensity = merged.shellDensity === "compact" ? "compact" : "comfortable";
    const barModes = new Set(["auto", "always", "never"]);
    merged.bookmarksBarMode = barModes.has(merged.bookmarksBarMode) ? merged.bookmarksBarMode : DEFAULT_APP_SETTINGS.bookmarksBarMode;
    const tb0 = DEFAULT_APP_TOOLBAR_BUTTONS;
    const tbm = merged.toolbarButtons && typeof merged.toolbarButtons === "object" ? merged.toolbarButtons : {};
    merged.toolbarButtons = {
      home: typeof tbm.home === "boolean" ? tbm.home : tb0.home,
      bookmark: typeof tbm.bookmark === "boolean" ? tbm.bookmark : tb0.bookmark,
      sitePerm: typeof tbm.sitePerm === "boolean" ? tbm.sitePerm : tb0.sitePerm,
      translate: typeof tbm.translate === "boolean" ? tbm.translate : tb0.translate,
      vpn: typeof tbm.vpn === "boolean" ? tbm.vpn : tb0.vpn,
      ai: typeof tbm.ai === "boolean" ? tbm.ai : tb0.ai,
      zoomReset: typeof tbm.zoomReset === "boolean" ? tbm.zoomReset : tb0.zoomReset,
    };
    const ntp = new Set(["header", "strip", "both"]);
    merged.newTabButtonPlacement = ntp.has(merged.newTabButtonPlacement)
      ? merged.newTabButtonPlacement
      : DEFAULT_APP_SETTINGS.newTabButtonPlacement;
    return merged;
  }

  async function loadAppSettings() {
    if (window.nebula?.getSettings) {
      try {
        const s = await window.nebula.getSettings();
        appSettings = normalizeAppSettings(s);
        syncYoutubeAdSkipAdblockState();
        applyShellAppearance();
        syncChromeLayoutFromSettings();
        syncAiProviderAndModelFromSettings();
        if (typeof window.nebula.registerAiTabToolHandler === "function") {
          window.nebula.registerAiTabToolHandler(handleAiTabToolMessage);
        }
        refreshVpnPanelFromSettings();
        return;
      } catch {
        /* */
      }
    }
    appSettings = normalizeAppSettings(DEFAULT_APP_SETTINGS);
    syncYoutubeAdSkipAdblockState();
    applyShellAppearance();
    syncChromeLayoutFromSettings();
    syncAiProviderAndModelFromSettings();
    if (typeof window.nebula.registerAiTabToolHandler === "function") {
      window.nebula.registerAiTabToolHandler(handleAiTabToolMessage);
    }
    refreshVpnPanelFromSettings();
  }

  let shellSystemThemeCleanup = null;

  function shellAccentRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return { r: 110, g: 181, b: 255 };
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function detachShellSystemThemeListener() {
    if (typeof shellSystemThemeCleanup === "function") {
      shellSystemThemeCleanup();
      shellSystemThemeCleanup = null;
    }
  }

  function applyShellAppearance() {
    const root = document.documentElement;
    const shade = effectiveChromeShade();
    root.setAttribute("data-chrome-shade", shade);
    if (appSettings.shellDensity === "compact") {
      root.setAttribute("data-shell-density", "compact");
    } else {
      root.removeAttribute("data-shell-density");
    }
    const hex =
      appSettings.shellAccent && /^#[0-9a-fA-F]{6}$/.test(String(appSettings.shellAccent).trim())
        ? String(appSettings.shellAccent).trim().toLowerCase()
        : "#6eb5ff";
    const { r, g, b } = shellAccentRgb(hex);
    root.style.setProperty("--accent-r", String(r));
    root.style.setProperty("--accent-g", String(g));
    root.style.setProperty("--accent-b", String(b));
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-dim", `rgba(${r},${g},${b},0.15)`);

    detachShellSystemThemeListener();
    const theme = appSettings.shellTheme || "dark";
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyShellAppearance();
      mq.addEventListener("change", onChange);
      shellSystemThemeCleanup = () => mq.removeEventListener("change", onChange);
    }
    syncWelcomeThemeInAllTabs();
  }

  function aiDrawerIsOpen() {
    return !!(aiDrawer && !aiDrawer.hidden);
  }

  function sanitizeAiMessagesForStorage(ms) {
    const out = [];
    if (!Array.isArray(ms)) return out;
    for (const m of ms) {
      if (!m || typeof m !== "object") continue;
      const role = m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user";
      const content = typeof m.content === "string" ? m.content : "";
      if (role === "user" || role === "assistant" || role === "system") out.push({ role, content });
    }
    return out;
  }

  function loadAiConversationsStore() {
    let raw = "";
    try {
      raw = localStorage.getItem(aiConversationsStorageKey()) || "";
    } catch {
      return { v: AI_CONVERSATIONS_STORE_VERSION, lastOpenedId: "", items: [] };
    }
    if (!raw) return { v: AI_CONVERSATIONS_STORE_VERSION, lastOpenedId: "", items: [] };
    try {
      const j = JSON.parse(raw);
      const itemsIn = Array.isArray(j.items) ? j.items : [];
      const items = [];
      for (const it of itemsIn) {
        if (!it || typeof it !== "object") continue;
        const id = typeof it.id === "string" && it.id.trim() ? it.id.trim().slice(0, 80) : "";
        if (!id) continue;
        const title = typeof it.title === "string" ? it.title.trim().slice(0, 120) : "Chat";
        const updatedAt = Number(it.updatedAt) || 0;
        const messages = sanitizeAiMessagesForStorage(it.messages);
        items.push({ id, title: title || "Chat", updatedAt, messages });
      }
      const lastOpenedId = typeof j.lastOpenedId === "string" ? j.lastOpenedId.trim().slice(0, 80) : "";
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        v: AI_CONVERSATIONS_STORE_VERSION,
        lastOpenedId,
        items: items.slice(0, AI_CONVERSATIONS_MAX_ITEMS),
      };
    } catch {
      return { v: AI_CONVERSATIONS_STORE_VERSION, lastOpenedId: "", items: [] };
    }
  }

  function saveAiConversationsStore(store) {
    try {
      localStorage.setItem(aiConversationsStorageKey(), JSON.stringify(store));
    } catch {
      /* quota or private mode */
    }
  }

  function conversationTitleFromMessages(messages) {
    const u = messages.find((m) => m && m.role === "user" && String(m.content || "").trim());
    const t = u ? String(u.content).trim().replace(/\s+/g, " ") : "New chat";
    return t.slice(0, 80) || "New chat";
  }

  function populateAiConversationSelect() {
    if (!aiConversationSelect) return;
    const store = loadAiConversationsStore();
    const sorted = [...store.items].sort((a, b) => b.updatedAt - a.updatedAt);
    aiConversationSelect.replaceChildren();
    for (const it of sorted) {
      const opt = document.createElement("option");
      opt.value = it.id;
      opt.textContent = it.title;
      aiConversationSelect.appendChild(opt);
    }
    if (activeAiConversationId && sorted.some((x) => x.id === activeAiConversationId)) {
      aiConversationSelect.value = activeAiConversationId;
    }
  }

  function persistCurrentAiConversation() {
    if (!activeAiConversationId) return;
    const store = loadAiConversationsStore();
    const msgs = sanitizeAiMessagesForStorage(aiChatMessages);
    const title = conversationTitleFromMessages(msgs);
    const row = { id: activeAiConversationId, title, updatedAt: Date.now(), messages: msgs };
    const idx = store.items.findIndex((x) => x.id === activeAiConversationId);
    if (idx >= 0) store.items[idx] = row;
    else store.items.unshift(row);
    store.items.sort((a, b) => b.updatedAt - a.updatedAt);
    store.items = store.items.slice(0, AI_CONVERSATIONS_MAX_ITEMS);
    store.lastOpenedId = activeAiConversationId;
    saveAiConversationsStore(store);
    populateAiConversationSelect();
  }

  function openAiConversationById(id) {
    if (!id) return;
    removeAiStreamBubble();
    setAiThinkingVisible(false);
    const store = loadAiConversationsStore();
    const it = store.items.find((x) => x.id === id);
    activeAiConversationId = id;
    if (it && Array.isArray(it.messages)) {
      aiChatMessages = it.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
        content: typeof m.content === "string" ? m.content : "",
      }));
    } else {
      aiChatMessages = [];
    }
    renderAiMessageBubbles();
    store.lastOpenedId = id;
    saveAiConversationsStore(store);
    populateAiConversationSelect();
  }

  function startNewAiConversation() {
    const store = loadAiConversationsStore();
    if (activeAiConversationId) {
      const cur = store.items.find((x) => x.id === activeAiConversationId);
      if (cur && cur.messages.length === 0 && cur.title === "New chat") return;
    }
    removeAiStreamBubble();
    setAiThinkingVisible(false);
    activeAiConversationId = `ac_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    aiChatMessages = [];
    renderAiMessageBubbles();
    store.items.unshift({ id: activeAiConversationId, title: "New chat", updatedAt: Date.now(), messages: [] });
    store.items.sort((a, b) => b.updatedAt - a.updatedAt);
    store.items = store.items.slice(0, AI_CONVERSATIONS_MAX_ITEMS);
    store.lastOpenedId = activeAiConversationId;
    saveAiConversationsStore(store);
    populateAiConversationSelect();
  }

  function deleteActiveAiConversation() {
    if (!activeAiConversationId) return;
    if (!confirm("Delete this conversation from this profile?")) return;
    const store = loadAiConversationsStore();
    store.items = store.items.filter((x) => x.id !== activeAiConversationId);
    saveAiConversationsStore(store);
    const sorted = [...store.items].sort((a, b) => b.updatedAt - a.updatedAt);
    if (sorted.length) {
      openAiConversationById(sorted[0].id);
    } else {
      activeAiConversationId = "";
      startNewAiConversation();
    }
  }

  function ensureAiConversationsOnDrawerOpen() {
    const store = loadAiConversationsStore();
    if (activeAiConversationId && store.items.some((x) => x.id === activeAiConversationId)) {
      populateAiConversationSelect();
      return;
    }
    if (store.lastOpenedId && store.items.some((x) => x.id === store.lastOpenedId)) {
      openAiConversationById(store.lastOpenedId);
      return;
    }
    if (store.items.length) {
      const sorted = [...store.items].sort((a, b) => b.updatedAt - a.updatedAt);
      openAiConversationById(sorted[0].id);
      return;
    }
    startNewAiConversation();
  }

  function resetAiConversationsForProfileChange() {
    activeAiConversationId = "";
    aiChatMessages = [];
  }

  async function persistAiAssistantPatch(partial) {
    const base = normalizeAppAiAssistant(appSettings.aiAssistant || {});
    const next = normalizeAppAiAssistant({
      ...base,
      ...partial,
      modelByProvider: { ...base.modelByProvider, ...(partial.modelByProvider || {}) },
      customModelsByProvider: { ...base.customModelsByProvider, ...(partial.customModelsByProvider || {}) },
    });
    if (window.nebula?.setSettings) {
      try {
        const r = await window.nebula.setSettings({ aiAssistant: next });
        appSettings = normalizeAppSettings(r);
      } catch {
        appSettings = normalizeAppSettings({ ...appSettings, aiAssistant: next });
      }
    } else {
      appSettings = normalizeAppSettings({ ...appSettings, aiAssistant: next });
    }
    refreshAiModelSelect();
    void refreshAiDrawerHint();
  }

  function buildMergedModelIds(provider) {
    const pres = AI_PRESET_MODELS[provider] || [];
    const custom =
      (appSettings.aiAssistant &&
        appSettings.aiAssistant.customModelsByProvider &&
        appSettings.aiAssistant.customModelsByProvider[provider]) ||
      [];
    const seen = new Set();
    const out = [];
    for (const id of [...pres, ...custom]) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  function refreshAiModelSelect() {
    if (!aiProvider || !aiModel) return;
    const provider =
      aiProvider.value === "anthropic" ? "anthropic" : aiProvider.value === "google" ? "google" : "openai";
    const ids = buildMergedModelIds(provider);
    aiModel.replaceChildren();
    if (!ids.length) return;
    const current =
      (appSettings.aiAssistant && appSettings.aiAssistant.modelByProvider && appSettings.aiAssistant.modelByProvider[provider]) || "";
    for (const id of ids) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = id;
      aiModel.appendChild(opt);
    }
    if (ids.length && !ids.includes(current)) {
      const pick = ids[0];
      aiModel.value = pick;
      void persistAiAssistantPatch({ modelByProvider: { [provider]: pick } });
      return;
    }
    if (ids.length) aiModel.value = current && ids.includes(current) ? current : ids[0];
  }

  async function refreshAiDrawerHint() {
    if (!aiDrawerHint) return;
    try {
      const s = await window.nebula?.aiStatus?.();
      if (!s) {
        aiDrawerHint.textContent = "";
        return;
      }
      if (s.locked) {
        aiDrawerHint.textContent = "Saved passwords vault is locked — unlock it to use stored API keys.";
        return;
      }
      const p =
        aiProvider && aiProvider.value === "anthropic"
          ? "anthropic"
          : aiProvider && aiProvider.value === "google"
            ? "google"
            : "openai";
      const hk = s.providers && s.providers[p] && s.providers[p].hasKey;
      let msg = hk
        ? "Key for this provider is stored in the vault."
        : "No API key for this provider — add one in Settings → AI assistant.";
      const aiCfg =
        appSettings.aiAssistant && typeof appSettings.aiAssistant === "object" ? appSettings.aiAssistant : DEFAULT_AI_ASSISTANT_APP;
      if (aiCfg.webSearchEnabled === true && !s.braveSearch?.hasKey) {
        msg += " Web search is on but there is no Brave Search API key — add one under Settings → AI assistant → Web search.";
      }
      if (aiCfg.pageFetchEnabled === true) {
        msg += " Page fetch is on — the assistant may request public http(s) pages as plain text (no cookies; see Settings).";
      }
      if (aiCfg.tabAgentEnabled === true) {
        msg +=
          " Tab agent is on — the assistant may open real tabs or read tab text (your profile cookies apply; confirm before open if enabled in Settings).";
      }
      msg +=
        " Summarize tab sends a plain-text excerpt of the active http(s) page (not the home tab) to the model for a short summary.";
      aiDrawerHint.textContent = msg;
    } catch {
      aiDrawerHint.textContent = "";
    }
  }

  function ensureAiProviderSelect() {
    if (!aiProvider || aiProvider.dataset.nebulaAiInit === "1") return;
    aiProvider.dataset.nebulaAiInit = "1";
    aiProvider.replaceChildren();
    for (const [val, label] of [
      ["openai", "OpenAI"],
      ["anthropic", "Anthropic (Claude)"],
      ["google", "Google (Gemini)"],
    ]) {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      aiProvider.appendChild(opt);
    }
  }

  function syncAiProviderAndModelFromSettings() {
    ensureAiProviderSelect();
    if (!aiProvider) return;
    const ap =
      appSettings.aiAssistant && appSettings.aiAssistant.activeProvider ? String(appSettings.aiAssistant.activeProvider) : "openai";
    aiProvider.value = ap === "anthropic" || ap === "google" ? ap : "openai";
    refreshAiModelSelect();
  }

  function setAiThinkingVisible(on) {
    if (!aiThinkingRow) return;
    aiThinkingRow.hidden = !on;
    aiThinkingRow.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function removeAiStreamBubble() {
    if (aiStreamBubbleEl && aiStreamBubbleEl.parentNode) {
      aiStreamBubbleEl.remove();
    }
    aiStreamBubbleEl = null;
  }

  function renderAiMessageBubbles() {
    if (!aiMessagesEl) return;
    aiMessagesEl.replaceChildren();
    for (const m of aiChatMessages) {
      const div = document.createElement("div");
      div.className =
        "ai-msg " +
        (m.role === "user" ? "ai-msg-user" : m.role === "error" ? "ai-msg-error" : "ai-msg-assistant");
      div.textContent = m.content;
      aiMessagesEl.appendChild(div);
    }
    queueMicrotask(() => {
      try {
        aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
      } catch {
        /* */
      }
    });
  }

  function setAiDrawerOpen(open) {
    if (!aiDrawer || !btnAi) return;
    const wasOpen = !aiDrawer.hidden;
    aiDrawer.hidden = !open;
    aiDrawer.setAttribute("aria-hidden", open ? "false" : "true");
    btnAi.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      closeTranslatePanel();
      closeVpnPanel();
      syncAiProviderAndModelFromSettings();
      void refreshAiDrawerHint();
      ensureAiConversationsOnDrawerOpen();
    }
    if (!open && wasOpen) scheduleRestoreGuestFocus();
  }

  function closeAiDrawer() {
    setAiDrawerOpen(false);
  }

  function toggleAiDrawer() {
    setAiDrawerOpen(!aiDrawerIsOpen());
  }

  /**
   * @param {"openai"|"anthropic"|"google"} provider
   * @param {string} model
   * @param {{ role: string, content: string }[]} messages
   */
  async function streamAiAssistantFromMessages(provider, model, messages) {
    let full = "";
    if (typeof window.nebula?.aiChatStream !== "function") {
      throw new Error("Streaming is not available.");
    }
    await new Promise((resolve, reject) => {
      window.nebula.aiChatStream(
        { provider, model, messages },
        (chunk) => {
          setAiThinkingVisible(false);
          full += chunk;
          if (!aiMessagesEl) return;
          if (!aiStreamBubbleEl) {
            aiStreamBubbleEl = document.createElement("div");
            aiStreamBubbleEl.className = "ai-msg ai-msg-assistant ai-msg-streaming";
            aiStreamBubbleEl.setAttribute("aria-live", "polite");
            aiMessagesEl.appendChild(aiStreamBubbleEl);
          }
          aiStreamBubbleEl.textContent = full;
          queueMicrotask(() => {
            try {
              aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
            } catch {
              /* */
            }
          });
        },
        () => resolve(),
        (err) => reject(new Error(String(err || "Stream failed")))
      );
    });
    return full;
  }

  async function aiSendUserMessage() {
    if (aiSendBusy || !aiInput || !aiModel || !aiProvider) return;
    const text = String(aiInput.value || "").trim();
    if (!text) return;
    const provider =
      aiProvider.value === "anthropic" ? "anthropic" : aiProvider.value === "google" ? "google" : "openai";
    const model = String(aiModel.value || "").trim();
    if (!model) return;
    aiInput.value = "";
    aiChatMessages.push({ role: "user", content: text });
    renderAiMessageBubbles();
    const payloadMessages = aiChatMessages.filter((m) => m.role !== "error").map((m) => ({ role: m.role, content: m.content }));
    aiSendBusy = true;
    removeAiStreamBubble();
    setAiThinkingVisible(true);
    if (aiSendBtn) aiSendBtn.disabled = true;
    if (aiSummarizeTabBtn) aiSummarizeTabBtn.disabled = true;
    if (aiInput) aiInput.disabled = true;
    let full = "";
    try {
      full = await streamAiAssistantFromMessages(provider, model, payloadMessages);
      removeAiStreamBubble();
      if (full.trim()) {
        aiChatMessages.push({ role: "assistant", content: full });
      } else {
        aiChatMessages.push({ role: "error", content: "Empty response." });
      }
    } catch (e) {
      removeAiStreamBubble();
      aiChatMessages.push({ role: "error", content: String(e && e.message ? e.message : e) });
    }
    setAiThinkingVisible(false);
    if (aiSendBtn) aiSendBtn.disabled = false;
    if (aiSummarizeTabBtn) aiSummarizeTabBtn.disabled = false;
    if (aiInput) aiInput.disabled = false;
    aiSendBusy = false;
    renderAiMessageBubbles();
    persistCurrentAiConversation();
  }

  async function aiSummarizeCurrentTab() {
    if (aiSendBusy || !aiModel || !aiProvider) return;
    const provider =
      aiProvider.value === "anthropic" ? "anthropic" : aiProvider.value === "google" ? "google" : "openai";
    const model = String(aiModel.value || "").trim();
    if (!model) {
      alert("Choose a model in the assistant drawer first.");
      return;
    }
    const w = getActiveWebview();
    if (!w || typeof w.executeJavaScript !== "function") {
      alert("No active tab to summarize.");
      return;
    }
    let pageUrl = "";
    let title = "";
    try {
      pageUrl = w.getURL() || "";
      title = w.getTitle() || "";
    } catch {
      alert("Could not read this tab.");
      return;
    }
    if (!isHttpLikePageUrl(pageUrl) || isWelcomePageUrl(pageUrl)) {
      alert("Open a normal web page (http or https) in this tab first — not the home page or an internal URL.");
      return;
    }

    setAiDrawerOpen(true);

    const text = await extractPlainTextFromGuestWebview(w);
    const excerpt = String(text || "").slice(0, AI_TAB_AGENT_TEXT_MAX);
    const userLabel = `Summarize this tab — ${title || "Untitled"}`;
    const systemLine =
      "You summarize web pages for the user. Use only the plain-text excerpt below (it may be truncated). If it is empty or unclear, say so briefly. Output a concise summary (a title line plus a short paragraph or a few bullets). Do not invent facts not supported by the excerpt.";
    const userPayload = `Page title: ${title || "(none)"}\nURL: ${pageUrl}\n\nPlain-text excerpt:\n${excerpt}`;

    aiChatMessages.push({ role: "user", content: userLabel });
    renderAiMessageBubbles();

    aiSendBusy = true;
    removeAiStreamBubble();
    setAiThinkingVisible(true);
    if (aiSendBtn) aiSendBtn.disabled = true;
    if (aiSummarizeTabBtn) aiSummarizeTabBtn.disabled = true;
    if (aiInput) aiInput.disabled = true;

    let full = "";
    try {
      full = await streamAiAssistantFromMessages(provider, model, [
        { role: "system", content: systemLine },
        { role: "user", content: userPayload },
      ]);
      removeAiStreamBubble();
      if (full.trim()) {
        aiChatMessages.push({ role: "assistant", content: full.trim() });
      } else {
        aiChatMessages.push({ role: "error", content: "Empty response." });
      }
    } catch (e) {
      removeAiStreamBubble();
      aiChatMessages.push({ role: "error", content: String(e && e.message ? e.message : e) });
    }
    setAiThinkingVisible(false);
    if (aiSendBtn) aiSendBtn.disabled = false;
    if (aiSummarizeTabBtn) aiSummarizeTabBtn.disabled = false;
    if (aiInput) aiInput.disabled = false;
    aiSendBusy = false;
    renderAiMessageBubbles();
    persistCurrentAiConversation();
  }

  function syncChromeLayoutFromSettings() {
    const tb = appSettings.toolbarButtons || {};
    if (btnHome) {
      btnHome.hidden = !tb.home;
      btnHome.setAttribute("aria-hidden", tb.home ? "false" : "true");
    }
    if (btnBookmark) {
      btnBookmark.hidden = !tb.bookmark;
      btnBookmark.setAttribute("aria-hidden", tb.bookmark ? "false" : "true");
    }
    if (btnSitePerm) {
      btnSitePerm.hidden = !tb.sitePerm;
      btnSitePerm.setAttribute("aria-hidden", tb.sitePerm ? "false" : "true");
    }
    if (translateDropdownWrap) {
      translateDropdownWrap.hidden = !tb.translate;
      translateDropdownWrap.setAttribute("aria-hidden", tb.translate ? "false" : "true");
    }
    if (vpnDropdownWrap) {
      vpnDropdownWrap.hidden = !tb.vpn;
      vpnDropdownWrap.setAttribute("aria-hidden", tb.vpn ? "false" : "true");
    }
    if (aiToolbarWrap) {
      aiToolbarWrap.hidden = !tb.ai;
      aiToolbarWrap.setAttribute("aria-hidden", tb.ai ? "false" : "true");
    }
    if (btnZoomReset) {
      btnZoomReset.hidden = !tb.zoomReset;
      btnZoomReset.setAttribute("aria-hidden", tb.zoomReset ? "false" : "true");
    }
    const ntp = appSettings.newTabButtonPlacement || "both";
    if (btnNewTab) {
      btnNewTab.hidden = ntp === "strip";
      btnNewTab.setAttribute("aria-hidden", ntp === "strip" ? "true" : "false");
    }
    if (btnNewTabStrip) {
      btnNewTabStrip.hidden = ntp === "header";
      btnNewTabStrip.setAttribute("aria-hidden", ntp === "header" ? "true" : "false");
    }
    if (!tb.translate) closeTranslatePanel();
    if (!tb.vpn) closeVpnPanel();
    if (!tb.ai) closeAiDrawer();
  }

  function syncYoutubeAdSkipAdblockState() {
    if (window.NebulaYoutubeAdSkip && typeof window.NebulaYoutubeAdSkip.configure === "function") {
      window.NebulaYoutubeAdSkip.configure({
        getAdblockBlockingEnabled: () => appSettings.adblockEnabled !== false,
      });
    }
  }

  function homeUrl() {
    return new URL(HOME_FILE, window.location.href).href;
  }

  function isWelcomePageUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    if (urlStr.includes(HOME_FILE)) return true;
    try {
      const p = new URL(urlStr).pathname;
      return p.endsWith("/" + HOME_FILE) || p.endsWith(HOME_FILE);
    } catch {
      return false;
    }
  }

  function effectiveChromeShade() {
    const theme = appSettings.shellTheme || "dark";
    if (theme === "light") return "light";
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  }

  function buildWelcomeThemeInjectionString() {
    const shade = effectiveChromeShade();
    const hex =
      appSettings.shellAccent && /^#[0-9a-fA-F]{6}$/.test(String(appSettings.shellAccent).trim())
        ? String(appSettings.shellAccent).trim().toLowerCase()
        : "#6eb5ff";
    const { r, g, b } = shellAccentRgb(hex);
    const shadeJson = JSON.stringify(shade);
    const hexJson = JSON.stringify(hex);
    return `(function(){try{var d=document.documentElement;d.setAttribute("data-welcome-shade",${shadeJson});d.style.setProperty("--accent",${hexJson});d.style.setProperty("--accent-r","${r}");d.style.setProperty("--accent-g","${g}");d.style.setProperty("--accent-b","${b}");}catch(_){}})();`;
  }

  function injectWelcomeThemeIntoWebview(webview) {
    if (!webview || typeof webview.executeJavaScript !== "function") return;
    let url = "";
    try {
      url = webview.getURL() || "";
    } catch {
      return;
    }
    if (!isWelcomePageUrl(url)) return;
    try {
      void webview.executeJavaScript(buildWelcomeThemeInjectionString(), false);
    } catch {
      /* */
    }
  }

  function syncWelcomeThemeInAllTabs() {
    for (const tab of tabs) {
      if (tab.el) injectWelcomeThemeIntoWebview(tab.el);
    }
  }

  function getHomePreloadPathForWebview() {
    try {
      if (typeof window.nebula?.getHomeWebviewPreloadPath !== "function") return "";
      return window.nebula.getHomeWebviewPreloadPath() || "";
    } catch {
      return "";
    }
  }

  function loadSavedSession() {
    try {
      const key = sessionRestoreStorageKey();
      let raw = localStorage.getItem(key);
      if (!raw && sanitizeProfileIdForSession(appSettings.activeProfileId) === "default") {
        raw = localStorage.getItem(SESSION_RESTORE_V1);
      }
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object" || !Array.isArray(p.tabs)) return null;
      if (p.version === 3 && typeof p.version === "number") return p;
      if (p.version === 2 && typeof p.version === "number") return p;
      if (p.version === 1 && typeof p.version === "number") return p;
      return null;
    } catch {
      return null;
    }
  }

  function clearSavedSession() {
    try {
      localStorage.removeItem(sessionRestoreStorageKey());
    } catch {
      /* */
    }
  }

  const TAB_GROUP_PALETTE = [
    "#f28b82",
    "#fdd663",
    "#7bc89c",
    "#79b8ff",
    "#c58af9",
    "#ffad47",
    "#72d6c8",
    "#afb9cf",
  ];

  function nextTabGroupColor(index) {
    return TAB_GROUP_PALETTE[Math.abs(index) % TAB_GROUP_PALETTE.length];
  }

  function hexColorForColorInput(raw) {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return "#79b8ff";
  }

  function pruneUnusedTabGroups() {
    tabGroups = tabGroups.filter((g) => tabs.some((t) => t.groupId === g.id));
  }

  /**
   * After drag/drop or other moves, tabs with the same groupId can end up non-adjacent in `tabs`.
   * syncTabStripDom would then treat them as two runs and dedupeSplitTabGroupRuns renames the second
   * run to a new group (looks like "only two tabs in the group"). Pull each group's members into one
   * contiguous block in original left-to-right order.
   */
  function consolidateTabGroupsInTabsArray() {
    const knownIds = new Set(tabGroups.map((g) => g.id));
    const consumed = new Set();
    const next = [];
    for (let i = 0; i < tabs.length; i++) {
      if (consumed.has(i)) continue;
      const t = tabs[i];
      const gid = t.groupId;
      if (!gid || !knownIds.has(gid)) {
        if (gid) t.groupId = null;
        next.push(t);
        continue;
      }
      const members = [];
      for (let j = 0; j < tabs.length; j++) {
        if (consumed.has(j)) continue;
        if (tabs[j].groupId === gid) {
          members.push(tabs[j]);
          consumed.add(j);
        }
      }
      for (const m of members) next.push(m);
    }
    if (next.length !== tabs.length) return;
    let same = true;
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i] !== next[i]) {
        same = false;
        break;
      }
    }
    if (same) return;
    tabs.splice(0, tabs.length, ...next);
  }

  function dedupeSplitTabGroupRuns() {
    const seen = new Set();
    let i = 0;
    while (i < tabs.length) {
      const g = tabs[i].groupId;
      if (!g) {
        i++;
        continue;
      }
      let j = i;
      while (j < tabs.length && tabs[j].groupId === g) j++;
      if (seen.has(g)) {
        const newId = "tg" + ++tabGroupSeq;
        const oldMeta = tabGroups.find((x) => x.id === g) || {
          label: "Group",
          color: nextTabGroupColor(tabGroups.length),
        };
        tabGroups.push({
          id: newId,
          label: oldMeta.label,
          color: oldMeta.color,
          collapsed: false,
        });
        for (let k = i; k < j; k++) tabs[k].groupId = newId;
      } else {
        seen.add(g);
      }
      i = j;
    }
    pruneUnusedTabGroups();
  }

  function ensureTabReorderIndicator() {
    if (!tabsStrip) return null;
    if (tabReorderIndicator && tabsStrip.contains(tabReorderIndicator)) return tabReorderIndicator;
    const el = document.createElement("div");
    el.className = "tab-reorder-indicator";
    el.setAttribute("aria-hidden", "true");
    tabsStrip.appendChild(el);
    tabReorderIndicator = el;
    return el;
  }

  /** @type {HTMLElement | null} */
  let tabDragHighlightGroupEl = null;

  function clearTabGroupDragHighlight() {
    if (tabDragHighlightGroupEl) {
      tabDragHighlightGroupEl.classList.remove("nebula-tab-group--drag-target");
      tabDragHighlightGroupEl = null;
    }
  }

  function hideTabReorderIndicator() {
    tabStripReorderActive = false;
    clearTabGroupDragHighlight();
    if (tabReorderIndicator) tabReorderIndicator.classList.remove("is-visible");
  }

  function positionTabReorderIndicator(insertBefore) {
    const ind = ensureTabReorderIndicator();
    if (!ind || !tabsStrip) return;
    const stripRect = tabsStrip.getBoundingClientRect();
    let x = stripRect.left + 6;
    if (insertBefore >= 0 && insertBefore < tabs.length) {
      const r = tabs[insertBefore].tabEl.getBoundingClientRect();
      x = r.left - stripRect.left + tabsStrip.scrollLeft;
    } else if (tabs.length > 0) {
      const r = tabs[tabs.length - 1].tabEl.getBoundingClientRect();
      x = r.right - stripRect.left + tabsStrip.scrollLeft;
    } else if (btnNewTabStrip) {
      const r = btnNewTabStrip.getBoundingClientRect();
      x = r.left - stripRect.left + tabsStrip.scrollLeft;
    }
    ind.style.left = `${Math.max(0, x)}px`;
    ind.classList.add("is-visible");
  }

  function syncTabStripDom() {
    if (!tabsStrip || !btnNewTabStrip) return;
    pruneUnusedTabGroups();
    consolidateTabGroupsInTabsArray();
    const keep = new Set([btnNewTabStrip]);
    if (tabReorderIndicator && tabsStrip.contains(tabReorderIndicator)) keep.add(tabReorderIndicator);
    for (const n of Array.from(tabsStrip.children)) {
      if (!keep.has(n)) n.remove();
    }
    dedupeSplitTabGroupRuns();
    let i = 0;
    while (i < tabs.length) {
      const gid = tabs[i].groupId;
      if (!gid || !tabGroups.find((g) => g.id === gid)) {
        if (gid) tabs[i].groupId = null;
        tabsStrip.insertBefore(tabs[i].tabEl, btnNewTabStrip);
        i++;
        continue;
      }
      let j = i;
      while (j < tabs.length && tabs[j].groupId === gid) j++;
      const meta = tabGroups.find((g) => g.id === gid) || {
        id: gid,
        label: "Group",
        color: nextTabGroupColor(0),
        collapsed: false,
      };
      const wrap = document.createElement("div");
      wrap.className = "nebula-tab-group";
      wrap.dataset.groupId = gid;
      wrap.style.setProperty("--tg-color", meta.color || nextTabGroupColor(0));
      const head = document.createElement("button");
      head.type = "button";
      head.className = "tab-group-head";
      head.textContent = meta.label || "Group";
      head.title = "Click to collapse or expand · right-click for menu · drag a tab here to add to this group";
      head.addEventListener("click", (e) => {
        e.preventDefault();
        toggleTabGroupCollapsed(gid);
      });
      head.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideTabContextMenu();
        openGroupContextMenu(e.clientX, e.clientY, gid);
      });
      const row = document.createElement("div");
      row.className = "tab-group-row";
      for (let k = i; k < j; k++) row.appendChild(tabs[k].tabEl);
      if (meta.collapsed) {
        row.hidden = true;
        head.setAttribute("aria-expanded", "false");
      } else {
        head.setAttribute("aria-expanded", "true");
      }
      wrap.appendChild(head);
      wrap.appendChild(row);
      tabsStrip.insertBefore(wrap, btnNewTabStrip);
      i = j;
    }
    if (tabReorderIndicator && !tabsStrip.contains(tabReorderIndicator)) {
      tabsStrip.appendChild(tabReorderIndicator);
    }
  }

  function reorderTabToIndex(draggedId, insertBefore) {
    const from = tabs.findIndex((t) => t.id === draggedId);
    if (from < 0) return;
    const ins = Math.max(0, Math.min(Number(insertBefore) || 0, tabs.length));
    if (ins === from || ins === from + 1) {
      syncTabStripDom();
      return;
    }
    const [row] = tabs.splice(from, 1);
    let to = ins;
    if (from < to) to--;
    tabs.splice(to, 0, row);
    normalizeTabsPinnedOrder();
    dedupeSplitTabGroupRuns();
    pruneUnusedTabGroups();
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function normalizeTabsPinnedOrder() {
    const pinned = [];
    const unpinned = [];
    for (const t of tabs) {
      if (t.pinned) {
        if (t.groupId) t.groupId = null;
        pinned.push(t);
      } else {
        unpinned.push(t);
      }
    }
    tabs.splice(0, tabs.length, ...pinned, ...unpinned);
  }

  function tabAllowsPinToggle(t) {
    return !!(t && !t.isPrivate && (!t.groupId || t.pinned));
  }

  function applyPinnedTabChrome(t) {
    if (!t || !t.tabEl) return;
    if (t.pinned) {
      t.tabEl.classList.add("tab--pinned");
      t.tabEl.title =
        "Pinned tab — stays on the left; drag to reorder with other pinned tabs. Right-click for menu.";
    } else {
      t.tabEl.classList.remove("tab--pinned");
      t.tabEl.title = t.isPrivate
        ? "Private tab — cookies and site data are cleared when you close Nebula. Not included in session restore. Drag to reorder…"
        : "Drag to reorder · drop on a group header to join it · drop outside groups to leave · right-click for menu";
    }
  }

  function setTabPinned(tabId, wantPinned) {
    const t = tabs.find((x) => x.id === tabId);
    if (!t || !tabAllowsPinToggle(t)) return;
    const next = !!wantPinned;
    if (t.pinned === next) return;
    t.pinned = next;
    if (t.pinned) t.groupId = null;
    applyPinnedTabChrome(t);
    normalizeTabsPinnedOrder();
    dedupeSplitTabGroupRuns();
    pruneUnusedTabGroups();
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function togglePinTabForActive() {
    const t = tabs.find((x) => x.id === activeId);
    if (!t || !tabAllowsPinToggle(t)) {
      if (t && t.isPrivate) return;
      if (t && t.groupId) {
        alert("Leave the tab group before pinning (or unpin from a pinned tab).");
      }
      return;
    }
    setTabPinned(t.id, !t.pinned);
  }

  function moveTabToEndOfGroup(tabId, gid) {
    const from = tabs.findIndex((t) => t.id === tabId);
    if (from < 0) return;
    const [row] = tabs.splice(from, 1);
    let insertAt = tabs.length;
    for (let i = tabs.length - 1; i >= 0; i--) {
      if (tabs[i].groupId === gid) {
        insertAt = i + 1;
        break;
      }
    }
    tabs.splice(insertAt, 0, row);
    normalizeTabsPinnedOrder();
  }

  function stripInsertIndexFromClientX(clientX) {
    if (tabs.length === 0) return 0;
    for (let i = 0; i < tabs.length; i++) {
      const r = tabs[i].tabEl.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      if (clientX < mid) return i;
    }
    if (btnNewTabStrip) {
      const br = btnNewTabStrip.getBoundingClientRect();
      if (clientX < br.left + br.width / 2) return tabs.length;
    }
    return tabs.length;
  }

  function toggleTabGroupCollapsed(gid) {
    const g = tabGroups.find((x) => x.id === gid);
    if (!g) return;
    g.collapsed = !g.collapsed;
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function openTabGroupRenameDialog(gid) {
    hideTabContextMenu();
    const g = tabGroups.find((x) => x.id === gid);
    if (!g || !tabGroupRenamePanel || !tabGroupRenameInput) return;
    tabGroupRenameGid = gid;
    tabGroupRenameInput.value = g.label;
    if (tabGroupRenameColor) {
      tabGroupRenameColor.value = hexColorForColorInput(g.color);
    }
    tabGroupRenamePanel.hidden = false;
    tabGroupRenamePanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => {
      try {
        tabGroupRenameInput.focus();
        tabGroupRenameInput.select();
      } catch {
        /* */
      }
    });
  }

  function closeTabGroupRenameDialog() {
    tabGroupRenameGid = null;
    if (tabGroupRenamePanel) {
      const wasVisible = !tabGroupRenamePanel.hidden;
      tabGroupRenamePanel.hidden = true;
      tabGroupRenamePanel.setAttribute("aria-hidden", "true");
      if (wasVisible) scheduleRestoreGuestFocus();
    }
  }

  function confirmTabGroupRename() {
    if (!tabGroupRenameGid || !tabGroupRenameInput) {
      closeTabGroupRenameDialog();
      return;
    }
    const g = tabGroups.find((x) => x.id === tabGroupRenameGid);
    const raw = String(tabGroupRenameInput.value || "").trim();
    const colorVal =
      tabGroupRenameColor && typeof tabGroupRenameColor.value === "string"
        ? hexColorForColorInput(tabGroupRenameColor.value)
        : "#79b8ff";
    closeTabGroupRenameDialog();
    if (!g || !raw) return;
    g.label = raw;
    g.color = colorVal;
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function wireTabGroupRenamePanel() {
    if (!tabGroupRenamePanel || !tabGroupRenameInput) return;
    if (tabGroupRenameSwatches && tabGroupRenameColor) {
      tabGroupRenameSwatches.replaceChildren();
      for (const hex of TAB_GROUP_PALETTE) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tab-group-rename-swatch";
        b.title = hex;
        b.style.backgroundColor = hex;
        b.addEventListener("click", () => {
          tabGroupRenameColor.value = hex;
        });
        tabGroupRenameSwatches.appendChild(b);
      }
    }
    tabGroupRenameCancel?.addEventListener("click", () => closeTabGroupRenameDialog());
    tabGroupRenameBackdrop?.addEventListener("click", () => closeTabGroupRenameDialog());
    tabGroupRenameSave?.addEventListener("click", () => confirmTabGroupRename());
    tabGroupRenameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmTabGroupRename();
      }
    });
  }

  function newTabGroupFromTab(tabId) {
    const t = tabs.find((x) => x.id === tabId);
    if (!t) return;
    const gid = "tg" + ++tabGroupSeq;
    tabGroups.push({
      id: gid,
      label: "Tab group",
      color: nextTabGroupColor(tabGroups.length - 1),
      collapsed: false,
    });
    t.groupId = gid;
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function removeTabFromGroup(tabId) {
    const t = tabs.find((x) => x.id === tabId);
    if (!t || !t.groupId) return;
    t.groupId = null;
    pruneUnusedTabGroups();
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function closeAllTabsInGroup(gid) {
    const ids = tabs.filter((t) => t.groupId === gid).map((t) => t.id);
    for (const id of ids) removeTab(id);
  }

  function ungroupAllTabsInGroup(gid) {
    for (const t of tabs) {
      if (t.groupId === gid) t.groupId = null;
    }
    tabGroups = tabGroups.filter((g) => g.id !== gid);
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function openGroupContextMenu(clientX, clientY, gid) {
    if (!tabCtxMenu) return;
    tabCtxTargetId = null;
    tabCtxMenu.innerHTML = "";
    const mk = (label, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.disabled = !!disabled;
      b.addEventListener("click", () => {
        hideTabContextMenu();
        fn();
      });
      tabCtxMenu.appendChild(b);
    };
    const has = tabs.some((t) => t.groupId === gid);
    mk("Edit group…", () => openTabGroupRenameDialog(gid), !has);
    mk("Ungroup tabs", () => ungroupAllTabsInGroup(gid), !has);
    mk("Close tabs in this group", () => closeAllTabsInGroup(gid), !has);
    tabCtxMenu.hidden = false;
    const pad = 8;
    let x = clientX;
    let y = clientY;
    tabCtxMenu.style.left = "0px";
    tabCtxMenu.style.top = "0px";
    const mw = tabCtxMenu.offsetWidth || 200;
    const mh = tabCtxMenu.offsetHeight || 120;
    if (x + mw + pad > window.innerWidth) x = window.innerWidth - mw - pad;
    if (y + mh + pad > window.innerHeight) y = window.innerHeight - mh - pad;
    tabCtxMenu.style.left = `${Math.max(pad, x)}px`;
    tabCtxMenu.style.top = `${Math.max(pad, y)}px`;
  }

  function hideTabContextMenu() {
    tabCtxTargetId = null;
    if (tabCtxMenu) {
      const wasVisible = !tabCtxMenu.hidden;
      tabCtxMenu.hidden = true;
      tabCtxMenu.innerHTML = "";
      if (wasVisible) scheduleRestoreGuestFocus();
    }
  }

  function openTabContextMenu(clientX, clientY, tabId) {
    if (!tabCtxMenu) return;
    tabCtxTargetId = tabId;
    const t = tabs.find((x) => x.id === tabId);
    tabCtxMenu.innerHTML = "";
    const mk = (label, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.disabled = !!disabled;
      b.addEventListener("click", () => {
        hideTabContextMenu();
        fn();
      });
      tabCtxMenu.appendChild(b);
    };
    mk(
      t?.pinned ? "Unpin tab" : "Pin tab",
      () => {
        const cur = tabs.find((x) => x.id === tabId);
        if (cur) setTabPinned(tabId, !cur.pinned);
      },
      !t || !tabAllowsPinToggle(t)
    );
    mk(
      t?.mediaState?.audioMuted ? "Unmute tab" : "Mute tab",
      () => {
        void (async () => {
          const tab = tabs.find((x) => x.id === tabId);
          if (!tab?.guestWcId || !window.nebula?.setGuestAudioMuted) return;
          const next = !tab.mediaState.audioMuted;
          try {
            const r = await window.nebula.setGuestAudioMuted({ guestWebContentsId: tab.guestWcId, muted: next });
            if (r?.ok && typeof r.audioMuted === "boolean") {
              tab.mediaState.audioMuted = r.audioMuted;
              renderTabMediaIndicators(tab);
            }
          } catch {
            /* */
          }
        })();
      },
      !t?.guestWcId
    );
    mk("New tab group", () => newTabGroupFromTab(tabId), false);
    mk("New private tab", () => createTab(homeUrl(), { private: true }), false);
    mk("Remove from group", () => removeTabFromGroup(tabId), !t?.groupId);
    mk("Edit this group…", () => t?.groupId && openTabGroupRenameDialog(t.groupId), !t?.groupId);
    mk("Close tabs in this group", () => t?.groupId && closeAllTabsInGroup(t.groupId), !t?.groupId);
    tabCtxMenu.hidden = false;
    const pad = 8;
    let x = clientX;
    let y = clientY;
    tabCtxMenu.style.left = "0px";
    tabCtxMenu.style.top = "0px";
    const mw = tabCtxMenu.offsetWidth || 200;
    const mh = tabCtxMenu.offsetHeight || 120;
    if (x + mw + pad > window.innerWidth) x = window.innerWidth - mw - pad;
    if (y + mh + pad > window.innerHeight) y = window.innerHeight - mh - pad;
    tabCtxMenu.style.left = `${Math.max(pad, x)}px`;
    tabCtxMenu.style.top = `${Math.max(pad, y)}px`;
  }

  function wireTabStripReorderAndContext() {
    document.addEventListener(
      "mousedown",
      (e) => {
        if (!tabCtxMenu || tabCtxMenu.hidden) return;
        if (e.button !== 0) return;
        if (e.target.closest("#tab-ctx-menu")) return;
        hideTabContextMenu();
      },
      true
    );
    if (!tabsStrip) return;
    tabsStrip.addEventListener("dragover", (e) => {
      if (!Array.from(e.dataTransfer.types || []).includes(TAB_DRAG_MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      tabStripReorderActive = true;
      const insertBefore = stripInsertIndexFromClientX(e.clientX);
      positionTabReorderIndicator(insertBefore);
      clearTabGroupDragHighlight();
      const gw = e.target.closest(".nebula-tab-group");
      if (gw) {
        gw.classList.add("nebula-tab-group--drag-target");
        tabDragHighlightGroupEl = gw;
      }
    });
    tabsStrip.addEventListener("dragleave", (e) => {
      if (!tabStripReorderActive) return;
      const rel = e.relatedTarget;
      if (rel && tabsStrip.contains(rel)) return;
      hideTabReorderIndicator();
    });
    tabsStrip.addEventListener("drop", (e) => {
      const draggedId = e.dataTransfer.getData(TAB_DRAG_MIME);
      if (!draggedId) return;
      if (e.target.closest(".tab-close, .tab-media-btn")) return;
      e.preventDefault();
      hideTabReorderIndicator();
      if (btnNewTabStrip && (e.target === btnNewTabStrip || btnNewTabStrip.contains(e.target))) {
        reorderTabToIndex(draggedId, tabs.length);
        return;
      }
      const groupWrap = e.target.closest(".nebula-tab-group");
      const hitTab = e.target.closest(".tab");
      if (groupWrap) {
        const gid = groupWrap.dataset.groupId;
        if (gid && tabGroups.some((g) => g.id === gid)) {
          const tDrag = tabs.find((x) => x.id === draggedId);
          if (tDrag) tDrag.groupId = gid;
          if (hitTab) {
            reorderTabToIndex(draggedId, stripInsertIndexFromClientX(e.clientX));
          } else {
            moveTabToEndOfGroup(draggedId, gid);
            dedupeSplitTabGroupRuns();
            pruneUnusedTabGroups();
            syncTabStripDom();
            scheduleSaveSessionSnapshot();
          }
          return;
        }
      }
      const tDrag = tabs.find((x) => x.id === draggedId);
      if (tDrag) tDrag.groupId = null;
      reorderTabToIndex(draggedId, stripInsertIndexFromClientX(e.clientX));
    });
  }

  function shouldOfferSessionRestore(session) {
    if (!session || !Array.isArray(session.tabs) || session.tabs.length === 0) return false;
    const home = homeUrl();
    try {
      if (
        session.tabs.length === 1 &&
        session.tabs[0] &&
        typeof session.tabs[0].url === "string" &&
        (session.tabs[0].url === home || session.tabs[0].url.includes(HOME_FILE))
      ) {
        return false;
      }
    } catch {
      /* */
    }
    return true;
  }

  function saveSessionSnapshot() {
    if (!sessionPersistenceReady) return;
    try {
      const persistTabs = tabs.filter((t) => !t.isPrivate);
      const tabPayload = persistTabs.map((t) => {
        let u = "";
        try {
          u = t.el.getURL() || "";
        } catch {
          u = "";
        }
        return { url: u, groupId: t.groupId || null, pinned: !!t.pinned };
      });
      let ai = persistTabs.findIndex((x) => x.id === activeId);
      if (ai < 0) ai = 0;
      if (persistTabs.length > 0 && ai >= persistTabs.length) ai = persistTabs.length - 1;
      const groups = tabGroups.filter((g) => persistTabs.some((t) => t.groupId === g.id));
      const data = {
        version: 3,
        tabs: tabPayload,
        activeIndex: ai,
        groups,
      };
      localStorage.setItem(sessionRestoreStorageKey(), JSON.stringify(data));
    } catch {
      /* */
    }
  }

  function scheduleSaveSessionSnapshot() {
    if (!sessionPersistenceReady) return;
    if (sessionSaveTimer) clearTimeout(sessionSaveTimer);
    sessionSaveTimer = setTimeout(() => {
      sessionSaveTimer = null;
      saveSessionSnapshot();
    }, 400);
  }

  function closeSessionRestorePanel() {
    if (!sessionRestorePanel || sessionRestorePanel.hidden) return;
    sessionRestorePanel.hidden = true;
    sessionRestorePanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  function openSessionRestorePanel(saved) {
    if (!sessionRestorePanel) return;
    if (sessionRestoreDesc && saved?.tabs?.length) {
      const n = saved.tabs.length;
      sessionRestoreDesc.textContent =
        n === 1
          ? "You had 1 tab open last time. Restore it or start with a new tab."
          : `You had ${n} tabs open last time. Restore them or start fresh.`;
    }
    sessionRestorePanel.hidden = false;
    sessionRestorePanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => sessionRestoreYes?.focus());
  }

  function finishStartupWithFreshHome() {
    sessionPersistenceReady = true;
    clearSavedSession();
    createTab(homeUrl());
  }

  function finishStartupWithRestoredTabs(saved) {
    sessionPersistenceReady = true;
    if (!saved?.tabs?.length) {
      finishStartupWithFreshHome();
      return;
    }
    tabGroups = [];
    if (saved.version >= 2 && Array.isArray(saved.groups)) {
      for (const g of saved.groups) {
        if (!g || typeof g !== "object") continue;
        if (typeof g.id !== "string" || typeof g.label !== "string") continue;
        tabGroups.push({
          id: g.id,
          label: g.label,
          color: typeof g.color === "string" ? g.color : nextTabGroupColor(tabGroups.length),
          collapsed: !!g.collapsed,
        });
        const m = /^tg(\d+)$/.exec(g.id);
        if (m) tabGroupSeq = Math.max(tabGroupSeq, parseInt(m[1], 10) || 0);
      }
    }
    /** @type {{ id: string }[]} */
    const created = [];
    for (let i = 0; i < saved.tabs.length; i++) {
      const row = saved.tabs[i];
      const u = row && typeof row.url === "string" ? row.url.trim() : "";
      if (!u) continue;
      if (row && row.private === true) continue;
      let gid = null;
      if (saved.version >= 2 && row && typeof row.groupId === "string" && tabGroups.some((x) => x.id === row.groupId)) {
        gid = row.groupId;
      }
      const wantPin = !!(row && row.pinned);
      if (wantPin) gid = null;
      created.push(createTab(u, { groupId: gid, pinned: wantPin }));
    }
    if (created.length === 0) {
      finishStartupWithFreshHome();
      return;
    }
    dedupeSplitTabGroupRuns();
    pruneUnusedTabGroups();
    syncTabStripDom();
    const ai = Math.min(Math.max(0, Number(saved.activeIndex) || 0), created.length - 1);
    const pick = created[ai]?.id || created[0]?.id;
    if (pick) selectTab(pick);
    scheduleSaveSessionSnapshot();
  }

  function tryOfferSessionRestoreOnLaunch() {
    const saved = loadSavedSession();
    if (shouldOfferSessionRestore(saved)) {
      openSessionRestorePanel(saved);
      sessionRestoreYes?.addEventListener(
        "click",
        () => {
          closeSessionRestorePanel();
          finishStartupWithRestoredTabs(saved);
        },
        { once: true }
      );
      sessionRestoreNo?.addEventListener(
        "click",
        () => {
          closeSessionRestorePanel();
          finishStartupWithFreshHome();
        },
        { once: true }
      );
      sessionRestoreBackdrop?.addEventListener(
        "click",
        () => {
          closeSessionRestorePanel();
          finishStartupWithFreshHome();
        },
        { once: true }
      );
      return;
    }
    sessionPersistenceReady = true;
    createTab(homeUrl());
  }

  async function refreshAboutSection() {
    const nameEl = document.getElementById("settings-about-name");
    const verEl = document.getElementById("settings-about-version");
    if (!verEl && !nameEl) return;
    try {
      const info = await window.nebula?.getAppInfo?.();
      if (nameEl && info && typeof info.name === "string") nameEl.textContent = info.name;
      if (verEl && info && typeof info.version === "string") verEl.textContent = info.version;
    } catch {
      if (verEl) verEl.textContent = "—";
    }
  }

  async function fetchChangelogDoc() {
    try {
      if (typeof window.nebula?.getChangelog === "function") {
        const doc = await window.nebula.getChangelog();
        if (doc && typeof doc === "object") return doc;
      }
    } catch {
      /* fall through */
    }
    try {
      const url = new URL("changelog.json", window.location.href).href;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("changelog fetch failed");
      return await r.json();
    } catch {
      return { entries: [] };
    }
  }

  /** @param {unknown} arr */
  function normalizeChangelogLines(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  }

  /**
   * @param {HTMLElement} parent
   * @param {string} label
   * @param {string[]} lines
   */
  function appendChangelogCategory(parent, label, lines) {
    if (lines.length === 0) return;
    const block = document.createElement("div");
    block.className = "changelog-category";
    const h = document.createElement("h4");
    h.className = "changelog-category-title";
    h.textContent = label;
    block.appendChild(h);
    const ul = document.createElement("ul");
    ul.className = "changelog-entry-list changelog-category-list";
    for (const line of lines) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    }
    block.appendChild(ul);
    parent.appendChild(block);
  }

  /**
   * @param {HTMLElement} container
   * @param {{ entries?: Record<string, unknown>[] }} doc
   * @param {string} currentVersion
   */
  function renderChangelogEntries(container, doc, currentVersion) {
    container.replaceChildren();
    const entries = Array.isArray(doc?.entries) ? doc.entries : [];
    const cv = String(currentVersion || "").trim();
    if (entries.length === 0) {
      const p = document.createElement("p");
      p.className = "changelog-empty";
      p.textContent = "No release notes found. Add entries to renderer/changelog.json.";
      container.appendChild(p);
      return;
    }
    const CATEGORY_KEYS = [
      { key: "added", label: "Added" },
      { key: "improvements", label: "Improvements" },
      { key: "fixes", label: "Fixes" },
    ];
    for (const ent of entries) {
      const ver = typeof ent.version === "string" ? ent.version.trim() : "";
      const wrap = document.createElement("section");
      wrap.className = "changelog-entry";
      if (cv && ver === cv) wrap.classList.add("changelog-entry--current");

      const head = document.createElement("div");
      head.className = "changelog-entry-head";

      const title = document.createElement("h3");
      title.className = "changelog-entry-version";
      title.textContent = ver || "Release";
      head.appendChild(title);

      if (typeof ent.date === "string" && ent.date.trim()) {
        const d = document.createElement("span");
        d.className = "changelog-entry-date";
        d.textContent = ent.date.trim();
        head.appendChild(d);
      }
      wrap.appendChild(head);

      let categorizedTotal = 0;
      const buckets = CATEGORY_KEYS.map(({ key, label }) => {
        const lines = normalizeChangelogLines(ent[key]);
        categorizedTotal += lines.length;
        return { label, lines };
      });

      const useCategories = categorizedTotal > 0;
      if (useCategories) {
        for (const { label, lines } of buckets) {
          appendChangelogCategory(wrap, label, lines);
        }
      } else {
        const ul = document.createElement("ul");
        ul.className = "changelog-entry-list";
        const lines = normalizeChangelogLines(ent.items);
        if (lines.length === 0) {
          const li = document.createElement("li");
          li.textContent = "(No bullet points for this version.)";
          ul.appendChild(li);
        } else {
          for (const line of lines) {
            const li = document.createElement("li");
            li.textContent = line;
            ul.appendChild(li);
          }
        }
        wrap.appendChild(ul);
      }

      container.appendChild(wrap);
    }
  }

  async function openChangelogPanel() {
    if (!changelogPanel || !changelogPanelBody) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    changelogPanel.hidden = false;
    changelogPanel.setAttribute("aria-hidden", "false");
    changelogPanelBody.innerHTML = "";
    const loading = document.createElement("p");
    loading.className = "changelog-loading";
    loading.textContent = "Loading…";
    changelogPanelBody.appendChild(loading);
    let ver = "";
    try {
      const info = await window.nebula?.getAppInfo?.();
      ver = info && typeof info.version === "string" ? info.version : "";
    } catch {
      ver = "";
    }
    const doc = await fetchChangelogDoc();
    changelogPanelBody.innerHTML = "";
    renderChangelogEntries(changelogPanelBody, doc, ver);
    queueMicrotask(() => changelogPanelClose?.focus());
  }

  function closeChangelogPanel() {
    if (!changelogPanel || changelogPanel.hidden) return;
    changelogPanel.hidden = true;
    changelogPanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  /** @type {object | null} */
  let activePermissionPayload = null;

  function hidePermissionPromptPanelOnly() {
    if (!permissionPromptPanel || permissionPromptPanel.hidden) return;
    permissionPromptPanel.hidden = true;
    permissionPromptPanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  function rejectActivePermissionIfAny() {
    if (!activePermissionPayload || !window.nebula?.respondToPermissionRequest) {
      activePermissionPayload = null;
      hidePermissionPromptPanelOnly();
      return;
    }
    const p = activePermissionPayload;
    activePermissionPayload = null;
    hidePermissionPromptPanelOnly();
    window.nebula.respondToPermissionRequest({
      id: p.id,
      origin: p.origin,
      allow: false,
      remember: false,
      persist: null,
    });
  }

  function buildPermissionPersist(payload, allow, remember) {
    if (!remember) return null;
    const persist = {};
    if (payload.kind === "simple" && payload.siteKey) {
      persist[payload.siteKey] = allow ? "allow" : "block";
      return persist;
    }
    if (payload.kind === "media") {
      if (payload.needsCamera) persist.camera = allow ? "allow" : "block";
      if (payload.needsMicrophone) persist.microphone = allow ? "allow" : "block";
      return persist;
    }
    return null;
  }

  function finishPermissionPrompt(allow) {
    if (!activePermissionPayload || !window.nebula?.respondToPermissionRequest) return;
    const p = activePermissionPayload;
    const remember = !!(permissionPromptRemember && permissionPromptRemember.checked);
    window.nebula.respondToPermissionRequest({
      id: p.id,
      origin: p.origin,
      allow,
      remember,
      persist: buildPermissionPersist(p, allow, remember),
    });
    activePermissionPayload = null;
    hidePermissionPromptPanelOnly();
  }

  function openPermissionPromptPanel(payload) {
    activePermissionPayload = payload;
    if (!permissionPromptPanel || !permissionPromptMessage) return;
    const origin = typeof payload.origin === "string" ? payload.origin : "";
    let msg = "";
    if (payload.kind === "media") {
      const lab = typeof payload.label === "string" ? payload.label : "camera and microphone";
      msg = `${origin || "This site"} wants to use your ${lab}.`;
    } else {
      const lab = typeof payload.label === "string" ? payload.label : "this permission";
      msg = `${origin || "This site"} wants to access ${lab}.`;
    }
    permissionPromptMessage.textContent = msg;
    if (permissionPromptRemember) permissionPromptRemember.checked = true;
    permissionPromptPanel.hidden = false;
    permissionPromptPanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => permissionPromptAllow?.focus());
  }

  /**
   * @type {null | { kind: "password", tabId: string, payload: object, origin: string } | { kind: "session", tabId: string, pageUrl: string, title: string, origin: string, hostname: string }}
   */
  let activeSaveOffer = null;
  let lastPasswordOfferFingerprint = "";
  let lastPasswordOfferAt = 0;
  let lastCredentialOfferAt = 0;
  let lastCredentialOfferOrigin = "";
  /** @type {ReturnType<typeof setTimeout> | null} */
  let sessionVaultOfferTimerId = null;
  const sessionVaultOfferedOrSkippedOrigins = new Set();

  function loadSessionVaultDenyOrigins() {
    try {
      const raw = localStorage.getItem(SESSION_VAULT_DENY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set();
    }
  }

  function persistSessionVaultDenyOrigin(origin) {
    const s = loadSessionVaultDenyOrigins();
    s.add(origin);
    try {
      localStorage.setItem(SESSION_VAULT_DENY_KEY, JSON.stringify([...s]));
    } catch {
      /* */
    }
  }

  function loadPasswordSaveDenyOrigins() {
    try {
      const raw = localStorage.getItem(PASSWORD_SAVE_DENY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set();
    }
  }

  function persistPasswordSaveDenyOrigin(origin) {
    const s = loadPasswordSaveDenyOrigins();
    s.add(origin);
    try {
      localStorage.setItem(PASSWORD_SAVE_DENY_KEY, JSON.stringify([...s]));
    } catch {
      /* */
    }
  }

  function closePasswordSaveOfferPanel() {
    activeSaveOffer = null;
    if (passwordSaveOfferTitle) passwordSaveOfferTitle.textContent = "Save password?";
    if (passwordSaveOfferSave) passwordSaveOfferSave.textContent = "Save";
    if (!passwordSaveOfferPanel || passwordSaveOfferPanel.hidden) return;
    passwordSaveOfferPanel.hidden = true;
    passwordSaveOfferPanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  function scheduleSessionVaultOfferCheck(tabId) {
    const tab0 = tabs.find((t) => t.id === tabId);
    if (tab0?.isPrivate) return;
    if (tabId !== activeId) return;
    if (sessionVaultOfferTimerId != null) {
      clearTimeout(sessionVaultOfferTimerId);
      sessionVaultOfferTimerId = null;
    }
    sessionVaultOfferTimerId = window.setTimeout(() => {
      sessionVaultOfferTimerId = null;
      void maybeOfferSessionVaultPlaceholder(tabId);
    }, 5000);
  }

  async function maybeOfferSessionVaultPlaceholder(tabId) {
    if (tabId !== activeId) return;
    if (passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) return;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab?.el) return;
    let pageUrl = "";
    try {
      pageUrl = tab.el.getURL() || "";
    } catch {
      return;
    }
    if (!pageUrl || !/^https:\/\//i.test(pageUrl)) return;
    let origin = "";
    let hostname = "";
    try {
      const u = new URL(pageUrl);
      origin = u.origin;
      hostname = u.hostname;
    } catch {
      return;
    }
    if (loadSessionVaultDenyOrigins().has(origin)) return;
    if (sessionVaultOfferedOrSkippedOrigins.has(origin)) return;
    if (Date.now() - lastCredentialOfferAt < 25000 && lastCredentialOfferOrigin === origin) return;

    try {
      const r = await window.nebula?.vaultSessionOfferCheck?.({ pageUrl });
      if (!r?.offer) return;
    } catch {
      return;
    }

    sessionVaultOfferedOrSkippedOrigins.add(origin);
    const title = tab.titleEl?.textContent?.trim() || "";
    activeSaveOffer = { kind: "session", tabId, pageUrl, title, origin, hostname };
    if (!passwordSaveOfferPanel || !passwordSaveOfferMessage || !passwordSaveOfferTitle) return;
    passwordSaveOfferTitle.textContent = "Add site to saved passwords?";
    passwordSaveOfferMessage.textContent = `Nebula sees a saved session (cookies) at ${hostname}, but no vault entry for this site. Add a placeholder with an empty password? You can edit it later.`;
    if (passwordSaveOfferSave) passwordSaveOfferSave.textContent = "Add to vault";
    passwordSaveOfferPanel.hidden = false;
    passwordSaveOfferPanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => passwordSaveOfferSave?.focus());
  }

  function considerLoginCaptureForVault(tabId, payload) {
    const tab0 = tabs.find((t) => t.id === tabId);
    if (tab0?.isPrivate) return;
    if (!payload || typeof payload !== "object") return;
    let origin = "";
    try {
      origin = new URL(typeof payload.pageUrl === "string" ? payload.pageUrl : "").origin;
    } catch {
      return;
    }
    if (!origin || !/^https?:/i.test(origin)) return;
    if (loadPasswordSaveDenyOrigins().has(origin)) return;

    const username = typeof payload.username === "string" ? payload.username : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!password) return;
    if (payload.vaultOffer === false) return;

    const fingerprint = `${origin}\t${username}\t${password}`;
    const now = Date.now();
    if (fingerprint === lastPasswordOfferFingerprint && now - lastPasswordOfferAt < 10000) return;
    lastPasswordOfferFingerprint = fingerprint;
    lastPasswordOfferAt = now;
    lastCredentialOfferAt = now;
    lastCredentialOfferOrigin = origin;
    if (sessionVaultOfferTimerId != null) {
      clearTimeout(sessionVaultOfferTimerId);
      sessionVaultOfferTimerId = null;
    }

    let host = "";
    try {
      host = new URL(origin).hostname;
    } catch {
      host = origin;
    }

    activeSaveOffer = { kind: "password", tabId, payload, origin };
    if (!passwordSaveOfferPanel || !passwordSaveOfferMessage) return;

    if (passwordSaveOfferTitle) passwordSaveOfferTitle.textContent = "Save password?";
    if (passwordSaveOfferSave) passwordSaveOfferSave.textContent = "Save";
    const userBit = username ? username : "(no username detected)";
    passwordSaveOfferMessage.textContent = `Save this password for ${host}? User: ${userBit}`;
    passwordSaveOfferPanel.hidden = false;
    passwordSaveOfferPanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => passwordSaveOfferSave?.focus());
  }

  async function confirmPasswordSaveOffer() {
    const cur = activeSaveOffer;
    if (cur?.kind === "session") {
      try {
        const added = await window.nebula?.vaultAddSessionPlaceholder?.({
          pageUrl: cur.pageUrl,
          title: cur.title,
          skipCookieCheck: true,
        });
        if (added && !added.ok && added.error === "exists") {
          alert("This site is already in your saved passwords.");
        }
      } catch {
        /* */
      }
      closePasswordSaveOfferPanel();
      if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
      return;
    }
    if (cur?.kind !== "password" || !cur.payload) {
      closePasswordSaveOfferPanel();
      return;
    }
    const p = cur.payload;
    try {
      await window.nebula?.vaultUpsertLogin?.({
        pageUrl: typeof p.pageUrl === "string" ? p.pageUrl : "",
        title: typeof p.pageTitle === "string" ? p.pageTitle : "",
        username: typeof p.username === "string" ? p.username : "",
        password: typeof p.password === "string" ? p.password : "",
      });
    } catch {
      /* */
    }
    closePasswordSaveOfferPanel();
    if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
  }

  /** @type {"all"|"login"|"session"|"password"} */
  let vaultListFilter = "all";
  /** @type {{ id: string }[]} */
  let vaultEntriesCache = [];
  /** Main hides passwords until Nebula account unlock when a local account exists. */
  let vaultSecretsLocked = false;
  let vaultHasLocalAccount = false;
  /** @type {ReturnType<typeof setInterval> | null} */
  let vaultUnlockPollId = null;

  function closeVaultPanel() {
    closePasswordSaveOfferPanel();
    if (!vaultPanel || vaultPanel.hidden) return;
    stopVaultUnlockPoll();
    vaultPanel.hidden = true;
    vaultPanel.setAttribute("aria-hidden", "true");
    if (vaultFormWrap) vaultFormWrap.hidden = true;
    if (vaultUnlockPass) vaultUnlockPass.value = "";
    if (vaultUnlockError) {
      vaultUnlockError.hidden = true;
      vaultUnlockError.textContent = "";
    }
    scheduleRestoreGuestFocus();
  }

  function vaultOriginLabel(entry) {
    try {
      if (entry.origin) return entry.origin.replace(/^https?:\/\//, "");
      if (entry.url) return new URL(entry.url).host;
    } catch {
      /* */
    }
    return entry.url || "—";
  }

  async function refreshVaultHint() {
    if (!vaultHintEncryption) return;
    try {
      const st = await window.nebula?.vaultStatus?.();
      let extra = "";
      if (vaultHasLocalAccount) {
        extra = vaultSecretsLocked
          ? " Local Nebula account: secrets are locked until you unlock."
          : " Local Nebula account: unlocked for viewing and copy.";
      }
      const backupTip =
        vaultEntriesCache.length >= 5
          ? " Tip: use Export… to keep a copy off this device (you can export without passwords)."
          : "";
      if (st && st.encryptionAvailable) {
        vaultHintEncryption.textContent =
          "Stored securely: the vault file is encrypted using OS secure storage when available." +
          extra +
          backupTip;
      } else {
        vaultHintEncryption.textContent =
          "OS secure storage is unavailable; passwords are saved as plain JSON in your Nebula profile folder." +
          extra +
          backupTip;
      }
    } catch {
      vaultHintEncryption.textContent = "";
    }
  }

  function stopVaultUnlockPoll() {
    if (vaultUnlockPollId != null) {
      clearInterval(vaultUnlockPollId);
      vaultUnlockPollId = null;
    }
  }

  function startVaultUnlockPoll() {
    stopVaultUnlockPoll();
    vaultUnlockPollId = window.setInterval(() => {
      if (!vaultPanel || vaultPanel.hidden) return;
      void loadVaultEntriesFromMain();
    }, 30000);
  }

  function updateVaultUnlockChrome() {
    const locked = vaultHasLocalAccount && vaultSecretsLocked;
    if (vaultUnlockOverlay) {
      vaultUnlockOverlay.hidden = !locked;
      vaultUnlockOverlay.setAttribute("aria-hidden", locked ? "false" : "true");
    }
    if (vaultLockBtn) {
      vaultLockBtn.hidden = !vaultHasLocalAccount || vaultSecretsLocked;
    }
  }

  async function refreshNebulaAccountSettingsUI() {
    if (!nebulaAccountCreateBlock || !nebulaAccountManageBlock) return;
    try {
      const st = await window.nebula?.accountStatus?.();
      const has = !!(st && st.hasAccount);
      nebulaAccountCreateBlock.hidden = has;
      nebulaAccountManageBlock.hidden = !has;
    } catch {
      nebulaAccountCreateBlock.hidden = false;
      nebulaAccountManageBlock.hidden = true;
    }
  }

  function setNebulaAccountSettingsMessage(text, opts) {
    if (!nebulaAccountSettingsMsg) return;
    if (opts?.sticky) {
      nebulaAccountSettingsMsg.dataset.sticky = "1";
    } else {
      delete nebulaAccountSettingsMsg.dataset.sticky;
    }
    nebulaAccountSettingsMsg.textContent = text || "";
  }

  async function submitVaultUnlock() {
    if (!vaultUnlockError) return;
    const pwd = vaultUnlockPass?.value ?? "";
    vaultUnlockError.hidden = true;
    vaultUnlockError.textContent = "";
    try {
      const r = await window.nebula?.accountUnlock?.({ password: pwd });
      if (r?.ok) {
        if (vaultUnlockPass) vaultUnlockPass.value = "";
        await loadVaultEntriesFromMain();
        void refreshTranslationKeyStatus();
        void refreshAiKeyStatus();
        if (aiDrawerIsOpen()) void refreshAiDrawerHint();
        queueMicrotask(() => vaultSearchInput?.focus());
        return;
      }
      vaultUnlockError.hidden = false;
      vaultUnlockError.textContent =
        r?.error === "bad_password" ? "Wrong password." : "Could not unlock.";
    } catch {
      vaultUnlockError.hidden = false;
      vaultUnlockError.textContent = "Could not unlock.";
    }
  }

  function vaultEntryIsSessionPlaceholderEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (entry.sessionPlaceholder === true) return true;
    const n = typeof entry.notes === "string" ? entry.notes : "";
    return n.includes("Nebula: Signed in via saved browser session");
  }

  function reloadGuestTabsForOrigin(origin) {
    if (!origin || typeof origin !== "string") return;
    for (const t of tabs) {
      if (!t?.el) continue;
      try {
        const u = new URL(t.el.getURL());
        if (u.origin === origin) t.el.reload();
      } catch {
        /* */
      }
    }
  }

  function vaultEntryHasStoredPassword(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (typeof entry.password === "string" && entry.password.length > 0) return true;
    return entry.passwordPresent === true;
  }

  function vaultEntryIsNebulaInternalTranslation(e) {
    if (!e || typeof e !== "object") return false;
    const u = typeof e.url === "string" ? e.url : "";
    return u.includes("nebula.settings/translation");
  }

  function vaultEntryIsNebulaInternalAi(e) {
    if (!e || typeof e !== "object") return false;
    const u = typeof e.url === "string" ? e.url : "";
    return u.includes("nebula.settings/ai/");
  }

  function renderVaultList() {
    if (!vaultListEl) return;
    const q = (vaultSearchInput?.value || "").trim().toLowerCase();
    vaultListEl.replaceChildren();
    let list = !q
      ? vaultEntriesCache.slice()
      : vaultEntriesCache.filter((e) => {
          const hay = `${e.title || ""} ${e.username || ""} ${e.url || ""} ${e.origin || ""}`.toLowerCase();
          return hay.includes(q);
        });
    list = list.filter((e) => !vaultEntryIsNebulaInternalTranslation(e) && !vaultEntryIsNebulaInternalAi(e));
    if (vaultListFilter === "session") {
      list = list.filter((e) => vaultEntryIsSessionPlaceholderEntry(e));
    } else if (vaultListFilter === "login") {
      list = list.filter((e) => !vaultEntryIsSessionPlaceholderEntry(e));
    } else if (vaultListFilter === "password") {
      list = list.filter((e) => !vaultEntryIsSessionPlaceholderEntry(e) && vaultEntryHasStoredPassword(e));
    }
    const rows = list;
    if (rows.length === 0) {
      const li = document.createElement("li");
      li.className = "vault-list-empty";
      let msg = "No matches.";
      if (vaultEntriesCache.length === 0) msg = "No saved passwords yet.";
      else if (!q && vaultListFilter !== "all") msg = "No entries in this category.";
      li.textContent = msg;
      vaultListEl.appendChild(li);
      return;
    }
    for (const e of rows) {
      const li = document.createElement("li");
      li.className = "vault-row";
      const main = document.createElement("div");
      main.className = "vault-row-main";
      const titleRow = document.createElement("div");
      titleRow.className = "vault-row-title-row";
      const title = document.createElement("div");
      title.className = "vault-row-title";
      title.textContent = e.title || vaultOriginLabel(e);
      titleRow.appendChild(title);
      if (vaultEntryIsSessionPlaceholderEntry(e)) {
        const badge = document.createElement("span");
        badge.className = "vault-row-badge";
        badge.textContent = "Session";
        titleRow.appendChild(badge);
      }
      const sub = document.createElement("div");
      sub.className = "vault-row-sub";
      sub.textContent = e.username || "—";
      main.appendChild(titleRow);
      main.appendChild(sub);
      const actions = document.createElement("div");
      actions.className = "vault-row-actions";
      const mkBtn = (label, cls, fn, disabled) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.textContent = label;
        if (disabled) {
          b.disabled = true;
          b.title = "Unlock the vault first";
        }
        b.addEventListener("click", () => void fn());
        return b;
      };
      const lockedOut = vaultSecretsLocked;
      actions.append(
        mkBtn("Copy user", "vault-row-btn", async () => {
          await window.nebula?.vaultCopyUsername?.({ id: e.id });
        }),
        mkBtn(
          "Copy pass",
          "vault-row-btn vault-row-btn--primary",
          async () => {
            const r = await window.nebula?.vaultCopyPassword?.({ id: e.id });
            if (r && r.locked) {
              void loadVaultEntriesFromMain();
              if (vaultHintEncryption) {
                vaultHintEncryption.textContent = "Unlock the vault to copy passwords.";
              }
            }
          },
          lockedOut
        ),
        mkBtn(
          "Edit",
          "vault-row-btn",
          () => startEditVaultEntry(e),
          lockedOut
        ),
        mkBtn("Remove", "vault-row-btn vault-row-btn--danger", async () => {
          const sessionRow = vaultEntryIsSessionPlaceholderEntry(e);
          const msg = sessionRow
            ? "Remove this entry and sign out on this device? Cookies and other site data for this site will be cleared."
            : "Remove this saved password?";
          if (!confirm(msg)) return;
          const r = await window.nebula?.vaultRemove?.({ id: e.id });
          if (r?.clearedSiteSession && r?.clearedOrigin) {
            reloadGuestTabsForOrigin(r.clearedOrigin);
          }
          await loadVaultEntriesFromMain();
        })
      );
      li.appendChild(main);
      li.appendChild(actions);
      vaultListEl.appendChild(li);
    }
  }

  async function loadVaultEntriesFromMain() {
    try {
      const raw = await window.nebula?.vaultList?.();
      if (raw && typeof raw === "object" && Array.isArray(raw.entries)) {
        vaultEntriesCache = raw.entries;
        vaultSecretsLocked = !!raw.secretsLocked;
        vaultHasLocalAccount = !!raw.hasLocalAccount;
      } else if (Array.isArray(raw)) {
        vaultEntriesCache = raw;
        vaultSecretsLocked = false;
        vaultHasLocalAccount = false;
      } else {
        vaultEntriesCache = [];
        vaultSecretsLocked = false;
        vaultHasLocalAccount = false;
      }
    } catch {
      vaultEntriesCache = [];
      vaultSecretsLocked = false;
      vaultHasLocalAccount = false;
    }
    updateVaultUnlockChrome();
    await refreshVaultHint();
    renderVaultList();
  }

  function resetVaultForm() {
    if (vaultEditId) vaultEditId.value = "";
    if (vaultFieldUrl) vaultFieldUrl.value = "";
    if (vaultFieldTitle) vaultFieldTitle.value = "";
    if (vaultFieldUser) vaultFieldUser.value = "";
    if (vaultFieldPass) vaultFieldPass.value = "";
    if (vaultFieldNotes) vaultFieldNotes.value = "";
  }

  function startEditVaultEntry(entry) {
    if (!vaultFormWrap) return;
    vaultFormWrap.hidden = false;
    if (vaultEditId) vaultEditId.value = entry.id || "";
    if (vaultFieldUrl) vaultFieldUrl.value = entry.url || "";
    if (vaultFieldTitle) vaultFieldTitle.value = entry.title || "";
    if (vaultFieldUser) vaultFieldUser.value = entry.username || "";
    if (vaultFieldPass) vaultFieldPass.value = entry.password || "";
    if (vaultFieldNotes) vaultFieldNotes.value = entry.notes || "";
    queueMicrotask(() => vaultFieldUrl?.focus());
  }

  async function openVaultPanel() {
    if (!vaultPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeChangelogPanel();
    if (!findBar.hidden) closeFindBar();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    vaultPanel.hidden = false;
    vaultPanel.setAttribute("aria-hidden", "false");
    resetVaultForm();
    if (vaultFormWrap) vaultFormWrap.hidden = true;
    if (vaultFilter) vaultFilter.value = vaultListFilter;
    if (vaultUnlockPass) vaultUnlockPass.value = "";
    if (vaultUnlockError) {
      vaultUnlockError.hidden = true;
      vaultUnlockError.textContent = "";
    }
    startVaultUnlockPoll();
    await loadVaultEntriesFromMain();
    queueMicrotask(() => {
      const locked = vaultHasLocalAccount && vaultSecretsLocked;
      if (locked && vaultUnlockPass) vaultUnlockPass.focus();
      else vaultPanelClose?.focus();
    });
  }

  function toggleVaultPanel() {
    if (!vaultPanel) return;
    if (vaultPanel.hidden) void openVaultPanel();
    else closeVaultPanel();
  }

  function shouldSkipHistoryUrl(url) {
    if (!url || typeof url !== "string") return true;
    if (url.includes(HOME_FILE)) return true;
    try {
      const u = new URL(url);
      if (u.protocol === "about:" || u.protocol === "chrome:" || u.protocol === "chrome-devtools:") {
        return true;
      }
    } catch {
      return true;
    }
    return false;
  }

  function loadHistoryFromStorage() {
    try {
      const key = historyStorageKey();
      let raw = localStorage.getItem(key);
      if (!raw && sanitizeProfileIdForSession(appSettings.activeProfileId) === "default") {
        raw = localStorage.getItem(HISTORY_LEGACY_V1);
        if (raw) {
          try {
            localStorage.setItem(key, raw);
          } catch {
            /* ignore quota */
          }
        }
      }
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((x) => x && typeof x.url === "string" && typeof x.visitedAt === "number")
        .map((x) => ({
          url: x.url,
          title: typeof x.title === "string" ? x.title : "",
          visitedAt: x.visitedAt,
        }));
    } catch {
      return [];
    }
  }

  function saveHistoryToStorage(entries) {
    localStorage.setItem(historyStorageKey(), JSON.stringify(entries.slice(0, HISTORY_MAX)));
  }

  function removeHistoryEntry(url, visitedAt) {
    const arr = loadHistoryFromStorage();
    const next = arr.filter((x) => !(x.url === url && x.visitedAt === visitedAt));
    saveHistoryToStorage(next);
    if (historyPanel && !historyPanel.hidden) renderHistoryList();
  }

  function recordHistoryVisit(url, title) {
    if (shouldSkipHistoryUrl(url)) return;
    const t = typeof title === "string" ? title.trim().slice(0, 500) : "";
    const now = Date.now();
    const arr = loadHistoryFromStorage();
    if (arr.length > 0 && arr[0].url === url) {
      arr[0] = { url, title: t || arr[0].title, visitedAt: now };
    } else {
      arr.unshift({ url, title: t, visitedAt: now });
    }
    saveHistoryToStorage(arr);
    if (historyPanel && !historyPanel.hidden) renderHistoryList();
  }

  function tryRecordHistoryForTab(tabId) {
    const tab = tabs.find((x) => x.id === tabId);
    if (!tab || tab.isPrivate) return;
    let url = "";
    try {
      url = tab.el.getURL() || "";
    } catch {
      return;
    }
    const title = tab.titleEl ? tab.titleEl.textContent || "" : "";
    recordHistoryVisit(url, title);
  }

  function formatHistoryTime(ts) {
    try {
      const thenMs = new Date(ts).getTime();
      if (!Number.isFinite(thenMs)) return "";
      const diff = Math.max(0, Date.now() - thenMs);
      const minuteMs = 60 * 1000;
      const hourMs = 60 * minuteMs;
      const dayMs = 24 * hourMs;
      const weekMs = 7 * dayMs;

      if (diff < minuteMs) return "Just now";

      const minutes = Math.floor(diff / minuteMs);
      if (diff < hourMs) {
        return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
      }

      const hours = Math.floor(diff / hourMs);
      if (diff < dayMs) {
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
      }

      const days = Math.floor(diff / dayMs);
      if (diff < weekMs) {
        return days === 1 ? "1 day ago" : `${days} days ago`;
      }

      const d = new Date(ts);
      const now = new Date();
      const sameYear = d.getFullYear() === now.getFullYear();
      return d.toLocaleDateString(
        undefined,
        sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }
      );
    } catch {
      return "";
    }
  }

  function renderHistoryList() {
    if (!historyListEl) return;
    historyListEl.replaceChildren();
    const entries = loadHistoryFromStorage();
    if (entries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "history-list-empty";
      empty.textContent = "No pages in history yet.";
      historyListEl.appendChild(empty);
      return;
    }
    for (const item of entries) {
      const li = document.createElement("li");
      li.className = "history-list-item";

      const row = document.createElement("div");
      row.className = "history-item-row";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "history-item";
      btn.dataset.historyUrl = item.url;
      btn.dataset.historyVisitedAt = String(item.visitedAt);
      const titleSpan = document.createElement("span");
      titleSpan.className = "history-item-title";
      titleSpan.textContent = item.title || item.url;
      const urlSpan = document.createElement("span");
      urlSpan.className = "history-item-url";
      urlSpan.textContent = item.url;
      const meta = document.createElement("span");
      meta.className = "history-item-meta";
      meta.textContent = formatHistoryTime(item.visitedAt);
      btn.appendChild(titleSpan);
      btn.appendChild(urlSpan);
      btn.appendChild(meta);
      btn.addEventListener("click", () => {
        openHistoryUrl(item.url);
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "history-item-remove";
      removeBtn.title = "Remove from history";
      removeBtn.setAttribute("aria-label", "Remove from history");
      removeBtn.innerHTML = "\u00D7";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeHistoryEntry(item.url, item.visitedAt);
      });

      row.appendChild(btn);
      row.appendChild(removeBtn);
      li.appendChild(row);
      historyListEl.appendChild(li);
    }
  }

  function openHistoryUrl(url) {
    closeHistoryPanel();
    const w = getActiveWebview();
    if (w) w.loadURL(url);
    else createTab(url);
  }

  function openHistoryPanel() {
    if (!historyPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    if (!findBar.hidden) closeFindBar();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    closeTranslatePanel();
    closeAiDrawer();
    historyPanel.hidden = false;
    historyPanel.setAttribute("aria-hidden", "false");
    renderHistoryList();
    queueMicrotask(() => historyPanelClose?.focus());
  }

  function closeHistoryPanel() {
    if (!historyPanel || historyPanel.hidden) return;
    historyPanel.hidden = true;
    historyPanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  function toggleHistoryPanel() {
    if (!historyPanel) return;
    if (historyPanel.hidden) openHistoryPanel();
    else closeHistoryPanel();
  }

  function closeSitePermissionsPanel() {
    if (!sitePermPanel || sitePermPanel.hidden) return;
    sitePermPanel.hidden = true;
    sitePermPanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  async function refreshSitePermPanel() {
    const originEl = document.getElementById("site-perm-origin");
    const noPageEl = document.getElementById("site-perm-no-page");
    const siteWrap = document.getElementById("site-perm-site-wrap");
    const global3p = document.getElementById("site-perm-global-3p");
    const w = getActiveWebview();
    let pageUrl = "";
    try {
      pageUrl = w ? w.getURL() : "";
    } catch {
      pageUrl = "";
    }
    refreshingSitePerm = true;
    try {
      let data = {
        currentOrigin: "",
        global: { blockThirdPartyCookies: false },
        defaults: {},
        site: {},
      };
      if (window.nebula?.getSitePermissions) {
        try {
          data = await window.nebula.getSitePermissions(pageUrl);
        } catch {
          /* ignore */
        }
      }
      if (global3p) global3p.checked = !!data.global?.blockThirdPartyCookies;

      const defs = data.defaults || {};
      const mapDef = (key) => {
        const v = defs[key];
        return v === "allow" || v === "block" || v === "ask" ? v : "ask";
      };
      const setDef = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.value = mapDef(key);
      };
      setDef("site-perm-def-camera", "camera");
      setDef("site-perm-def-microphone", "microphone");
      setDef("site-perm-def-geolocation", "geolocation");
      setDef("site-perm-def-notifications", "notifications");
      setDef("site-perm-def-screenCapture", "screenCapture");

      if (!pageUrl || !/^https?:/i.test(pageUrl)) {
        if (originEl) originEl.textContent = pageUrl || "—";
        if (noPageEl) noPageEl.hidden = false;
        if (siteWrap) siteWrap.hidden = true;
        return;
      }
      if (noPageEl) noPageEl.hidden = true;
      if (siteWrap) siteWrap.hidden = false;
      if (originEl) originEl.textContent = data.currentOrigin || new URL(pageUrl).origin;
      const mapSiteVal = (v) => (v === "allow" || v === "block" || v === "ask" ? v : "default");
      const map3p = (v) => (v === "allow" || v === "block" ? v : "default");
      const setSel = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.value = mapSiteVal(data.site[key]);
      };
      setSel("site-perm-camera", "camera");
      setSel("site-perm-microphone", "microphone");
      setSel("site-perm-geolocation", "geolocation");
      setSel("site-perm-notifications", "notifications");
      setSel("site-perm-screen", "screenCapture");
      const el3p = document.getElementById("site-perm-3p");
      if (el3p) el3p.value = map3p(data.site.thirdPartyCookies);
    } finally {
      refreshingSitePerm = false;
    }
  }

  function openSitePermissionsPanel() {
    if (!sitePermPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    if (!findBar.hidden) closeFindBar();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    hideOmniboxSuggestions();
    closeTranslatePanel();
    closeAiDrawer();
    sitePermPanel.hidden = false;
    sitePermPanel.setAttribute("aria-hidden", "false");
    void refreshSitePermPanel();
    queueMicrotask(() => sitePermClose?.focus());
  }

  function toggleSitePermissionsPanel() {
    if (!sitePermPanel) return;
    if (sitePermPanel.hidden) openSitePermissionsPanel();
    else closeSitePermissionsPanel();
  }

  async function onSitePermGlobalChange() {
    if (refreshingSitePerm) return;
    const el = document.getElementById("site-perm-global-3p");
    if (!el || !window.nebula?.setSitePermissions) return;
    try {
      await window.nebula.setSitePermissions({ blockThirdPartyCookiesGlobally: el.checked });
    } catch {
      /* ignore */
    }
  }

  async function onSitePermDefaultChange(ev) {
    if (refreshingSitePerm) return;
    const sel = ev.target;
    if (!sel.classList?.contains("site-perm-default-select")) return;
    const key = sel.dataset.defaultKey;
    if (!key) return;
    const value = sel.value;
    if (!window.nebula?.setSitePermissions) return;
    try {
      await window.nebula.setSitePermissions({
        defaultsPatch: { [key]: value },
      });
    } catch {
      /* ignore */
    }
  }

  async function onSitePermSelectChange(ev) {
    if (refreshingSitePerm) return;
    const sel = ev.target;
    if (!sel.classList?.contains("site-perm-select")) return;
    const key = sel.dataset.permKey;
    if (!key) return;
    const w = getActiveWebview();
    let pageUrl = "";
    try {
      pageUrl = w ? w.getURL() : "";
    } catch {
      return;
    }
    if (!/^https?:/i.test(pageUrl)) return;
    const origin = new URL(pageUrl).origin;
    const value = sel.value;
    if (!window.nebula?.setSitePermissions) return;
    try {
      await window.nebula.setSitePermissions({
        origin,
        patch: { [key]: value },
      });
      if (settingsPanel && !settingsPanel.hidden) void refreshSitePermissionSummary();
    } catch {
      /* ignore */
    }
  }

  function settingsShortcutMatch(e) {
    if (e.repeat) return false;
    if (e.key !== ",") return false;
    return e.ctrlKey || e.metaKey;
  }

  async function refreshTranslationKeyStatus() {
    const el = document.getElementById("settings-translate-key-status");
    if (!el) return;
    try {
      const s = await window.nebula?.translationStatus?.();
      if (!s) {
        el.textContent = "";
        return;
      }
      if (s.locked) {
        el.textContent =
          "Saved passwords vault is locked — unlock it to save or use a translation API key.";
        return;
      }
      if (s.hasKey) {
        el.textContent =
          "A translation API key is stored in the vault (" +
          (s.provider === "deepl" ? "DeepL" : "LibreTranslate") +
          "). It is never shown here.";
      } else {
        el.textContent = "No translation API key in the vault (optional).";
      }
    } catch {
      el.textContent = "";
    }
  }

  async function refreshAiKeyStatus() {
    const el = document.getElementById("settings-ai-key-status");
    const elBr = document.getElementById("settings-ai-brave-status");
    if (!el) return;
    try {
      const s = await window.nebula?.aiStatus?.();
      if (!s) {
        el.textContent = "";
        if (elBr) elBr.textContent = "";
        return;
      }
      if (s.locked) {
        el.textContent = "Saved passwords vault is locked — unlock it to save or use AI API keys.";
        if (elBr) elBr.textContent = "";
        return;
      }
      const bits = [];
      if (s.providers?.openai?.hasKey) bits.push("OpenAI");
      if (s.providers?.anthropic?.hasKey) bits.push("Anthropic");
      if (s.providers?.google?.hasKey) bits.push("Gemini");
      el.textContent = bits.length ? "Keys in vault: " + bits.join(", ") + "." : "No AI API keys in the vault yet (optional).";
      if (elBr) {
        elBr.textContent = s.braveSearch?.hasKey
          ? "Brave Search API key is stored in the vault."
          : "No Brave Search API key in the vault (optional unless web search is enabled).";
      }
    } catch {
      el.textContent = "";
      if (elBr) elBr.textContent = "";
    }
  }

  function populateSettingsForm() {
    const s = appSettings;
    const ss = s.searchSuggestions;
    const adEl = document.getElementById("settings-adblock-enabled");
    if (adEl) adEl.checked = s.adblockEnabled !== false;
    const fdEl = document.getElementById("settings-force-dark-mode");
    if (fdEl) fdEl.checked = s.forceDarkMode === true;
    const teEl = document.getElementById("settings-translate-engine");
    if (teEl) teEl.value = s.translateEngine === "libre" ? "libre" : "google-wrap";
    const tluEl = document.getElementById("settings-translate-libre-url");
    if (tluEl) tluEl.value = s.translateLibreUrl || DEFAULT_APP_SETTINGS.translateLibreUrl;
    const el = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.value = String(v);
    };
    const chk = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.checked = !!v;
    };
    const ai = s.aiAssistant && typeof s.aiAssistant === "object" ? s.aiAssistant : DEFAULT_AI_ASSISTANT_APP;
    el("settings-ai-openai-base", ai.openaiBaseUrl || DEFAULT_AI_ASSISTANT_APP.openaiBaseUrl);
    const setTa = (id, arr) => {
      const n = document.getElementById(id);
      if (n) n.value = (Array.isArray(arr) ? arr : []).join("\n");
    };
    setTa("settings-ai-custom-openai", ai.customModelsByProvider?.openai);
    setTa("settings-ai-custom-anthropic", ai.customModelsByProvider?.anthropic);
    setTa("settings-ai-custom-google", ai.customModelsByProvider?.google);
    chk("settings-ai-web-search-enabled", ai.webSearchEnabled === true);
    chk("settings-ai-page-fetch-enabled", ai.pageFetchEnabled === true);
    chk("settings-ai-tab-agent-enabled", ai.tabAgentEnabled === true);
    chk("settings-ai-tab-agent-confirm-nav", ai.tabAgentConfirmNavigation !== false);
    const net = s.network && typeof s.network === "object" ? s.network : DEFAULT_APP_SETTINGS.network;
    const px = net.proxy && typeof net.proxy === "object" ? net.proxy : DEFAULT_APP_SETTINGS.network.proxy;
    const pm = document.getElementById("settings-proxy-mode");
    if (pm) pm.value = px.mode === "system" || px.mode === "fixed" ? px.mode : "direct";
    el("settings-proxy-rules", px.proxyRules || "");
    el("settings-proxy-bypass", px.proxyBypassRules || "");
    chk("settings-ss-past", ss.enablePastSearch);
    chk("settings-ss-bookmarks", ss.enableBookmarks);
    chk("settings-ss-history", ss.enableHistory);
    chk("settings-ss-ddg", ss.enableDuckDuckGo);
    el("settings-ss-max-total", ss.maxTotal);
    el("settings-ss-max-past", ss.maxPastSearch);
    el("settings-ss-max-bookmarks", ss.maxBookmarks);
    el("settings-ss-max-history", ss.maxHistory);
    el("settings-ss-max-ddg", ss.maxDuckDuckGo);
    el("settings-ss-remote-min", ss.remoteMinChars);
    el("settings-ss-debounce", ss.debounceMs);
    const sel = document.getElementById("settings-ss-layer-order");
    if (sel) {
      const want = JSON.stringify(ss.layerOrder);
      let found = false;
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === want) {
          sel.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) sel.selectedIndex = 0;
    }
    const ps = settingsProfileSelect;
    if (ps) {
      ps.innerHTML = "";
      const plist = Array.isArray(s.profiles) && s.profiles.length ? s.profiles : DEFAULT_APP_SETTINGS.profiles;
      for (const p of plist) {
        if (!p || typeof p.id !== "string") continue;
        const o = document.createElement("option");
        o.value = p.id;
        o.textContent = typeof p.name === "string" && p.name ? p.name : p.id;
        ps.appendChild(o);
      }
      const want = s.activeProfileId || "default";
      ps.value = plist.some((x) => x && x.id === want) ? want : "default";
    }
    const st = document.getElementById("settings-shell-theme");
    if (st) st.value = s.shellTheme === "light" || s.shellTheme === "system" ? s.shellTheme : "dark";
    const sac = document.getElementById("settings-shell-accent");
    if (sac) sac.value = s.shellAccent && /^#[0-9a-fA-F]{6}$/.test(s.shellAccent) ? s.shellAccent : "#6eb5ff";
    const sd = document.getElementById("settings-shell-density");
    if (sd) sd.value = s.shellDensity === "compact" ? "compact" : "comfortable";
    const bm = document.getElementById("settings-bookmarks-bar-mode");
    if (bm) bm.value = s.bookmarksBarMode === "always" || s.bookmarksBarMode === "never" ? s.bookmarksBarMode : "auto";
    const ntp = document.getElementById("settings-new-tab-placement");
    if (ntp) {
      const p = s.newTabButtonPlacement;
      ntp.value = p === "header" || p === "strip" ? p : "both";
    }
    const tbb = s.toolbarButtons || {};
    chk("settings-tb-home", tbb.home !== false);
    chk("settings-tb-bookmark", tbb.bookmark !== false);
    chk("settings-tb-site-perm", tbb.sitePerm !== false);
    chk("settings-tb-translate", tbb.translate !== false);
    chk("settings-tb-vpn", tbb.vpn !== false);
    chk("settings-tb-ai", tbb.ai !== false);
    chk("settings-tb-zoom-reset", tbb.zoomReset !== false);
  }

  function parseAiModelLines(text) {
    const lines = String(text || "").split(/\r?\n/);
    const out = [];
    const seen = new Set();
    for (const line of lines) {
      const id = line.trim().slice(0, 128);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= 24) break;
    }
    return out;
  }

  function gatherSettingsPatchFromForm() {
    const num = (id, fallback) => {
      const n = document.getElementById(id);
      const v = n ? Number(n.value) : fallback;
      return Number.isFinite(v) ? v : fallback;
    };
    const chk = (id) => {
      const n = document.getElementById(id);
      return !!(n && n.checked);
    };
    let layerOrder = DEFAULT_APP_SETTINGS.searchSuggestions.layerOrder;
    const sel = document.getElementById("settings-ss-layer-order");
    if (sel && sel.value) {
      try {
        const p = JSON.parse(sel.value);
        if (Array.isArray(p) && p.length === 3) layerOrder = p;
      } catch {
        /* */
      }
    }
    let activeProfileId = appSettings.activeProfileId || "default";
    const ps = settingsProfileSelect;
    if (ps && typeof ps.value === "string") {
      const v = ps.value.trim().toLowerCase();
      if ((appSettings.profiles || []).some((p) => p && p.id === v)) activeProfileId = v;
    }
    const tb = {
      home: !!(document.getElementById("settings-tb-home")?.checked),
      bookmark: !!(document.getElementById("settings-tb-bookmark")?.checked),
      sitePerm: !!(document.getElementById("settings-tb-site-perm")?.checked),
      translate: !!(document.getElementById("settings-tb-translate")?.checked),
      vpn: !!(document.getElementById("settings-tb-vpn")?.checked),
      ai: !!(document.getElementById("settings-tb-ai")?.checked),
      zoomReset: !!(document.getElementById("settings-tb-zoom-reset")?.checked),
    };
    return {
      adblockEnabled: !!(document.getElementById("settings-adblock-enabled")?.checked),
      forceDarkMode: !!(document.getElementById("settings-force-dark-mode")?.checked),
      translateEngine:
        (document.getElementById("settings-translate-engine")?.value || "google-wrap") === "libre"
          ? "libre"
          : "google-wrap",
      translateLibreUrl: String(document.getElementById("settings-translate-libre-url")?.value || "").trim(),
      activeProfileId,
      shellTheme: (() => {
        const v = document.getElementById("settings-shell-theme")?.value || "dark";
        return v === "light" || v === "system" ? v : "dark";
      })(),
      shellAccent: (() => {
        const raw = String(document.getElementById("settings-shell-accent")?.value || "").trim();
        return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : "#6eb5ff";
      })(),
      shellDensity: document.getElementById("settings-shell-density")?.value === "compact" ? "compact" : "comfortable",
      bookmarksBarMode: (() => {
        const v = document.getElementById("settings-bookmarks-bar-mode")?.value || "auto";
        return v === "always" || v === "never" ? v : "auto";
      })(),
      toolbarButtons: tb,
      newTabButtonPlacement: (() => {
        const v = document.getElementById("settings-new-tab-placement")?.value || "both";
        return v === "header" || v === "strip" ? v : "both";
      })(),
      aiAssistant: normalizeAppAiAssistant({
        ...(appSettings.aiAssistant && typeof appSettings.aiAssistant === "object" ? appSettings.aiAssistant : DEFAULT_AI_ASSISTANT_APP),
        openaiBaseUrl: String(document.getElementById("settings-ai-openai-base")?.value || "").trim(),
        webSearchEnabled: chk("settings-ai-web-search-enabled"),
        pageFetchEnabled: chk("settings-ai-page-fetch-enabled"),
        tabAgentEnabled: chk("settings-ai-tab-agent-enabled"),
        tabAgentConfirmNavigation: chk("settings-ai-tab-agent-confirm-nav"),
        customModelsByProvider: {
          openai: parseAiModelLines(document.getElementById("settings-ai-custom-openai")?.value),
          anthropic: parseAiModelLines(document.getElementById("settings-ai-custom-anthropic")?.value),
          google: parseAiModelLines(document.getElementById("settings-ai-custom-google")?.value),
        },
      }),
      searchSuggestions: {
        enablePastSearch: chk("settings-ss-past"),
        enableBookmarks: chk("settings-ss-bookmarks"),
        enableHistory: chk("settings-ss-history"),
        enableDuckDuckGo: chk("settings-ss-ddg"),
        layerOrder,
        maxTotal: num("settings-ss-max-total", 10),
        maxPastSearch: num("settings-ss-max-past", 6),
        maxBookmarks: num("settings-ss-max-bookmarks", 4),
        maxHistory: num("settings-ss-max-history", 4),
        maxDuckDuckGo: num("settings-ss-max-ddg", 8),
        remoteMinChars: num("settings-ss-remote-min", 2),
        debounceMs: num("settings-ss-debounce", 220),
      },
      network: normalizeAppNetwork({
        proxy: {
          mode: String(document.getElementById("settings-proxy-mode")?.value || "direct").trim().toLowerCase(),
          proxyRules: String(document.getElementById("settings-proxy-rules")?.value || "").trim(),
          proxyBypassRules: String(document.getElementById("settings-proxy-bypass")?.value || "").trim(),
        },
      }),
      vpnHelper: normalizeAppVpnHelper(appSettings.vpnHelper || {}),
    };
  }

  function hideProfileAddPanel() {
    if (settingsProfileAddPanel) settingsProfileAddPanel.hidden = true;
    if (settingsProfileNewName) settingsProfileNewName.value = "";
  }

  function showProfileAddPanel() {
    if (!settingsProfileAddPanel || !settingsProfileNewName) return;
    settingsProfileAddPanel.hidden = false;
    queueMicrotask(() => {
      settingsProfileNewName.focus();
      try {
        settingsProfileNewName.select();
      } catch {
        /* */
      }
    });
  }

  async function commitNewProfileFromInput() {
    const raw = String(settingsProfileNewName?.value || "").trim().slice(0, 64);
    if (!raw) {
      alert("Enter a name for the new profile.");
      return;
    }
    let id = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    if (!id || id === "default") id = "p" + Date.now().toString(36).slice(-8);
    const profiles = [...(appSettings.profiles || [])];
    if (profiles.some((p) => p && p.id === id)) {
      alert("A profile with that id already exists. Pick a different name.");
      return;
    }
    profiles.push({ id, name: raw });
    hideProfileAddPanel();
    if (window.nebula?.setSettings) {
      try {
        const next = await window.nebula.setSettings({ profiles });
        appSettings = normalizeAppSettings(next);
      } catch {
        appSettings = normalizeAppSettings({ ...appSettings, profiles });
      }
    } else {
      appSettings = normalizeAppSettings({ ...appSettings, profiles });
    }
    populateSettingsForm();
  }

  function closeSettingsPanel() {
    if (!settingsPanel || settingsPanel.hidden) return;
    hideProfileAddPanel();
    closeChangelogPanel();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    settingsPanel.hidden = true;
    settingsPanel.setAttribute("aria-hidden", "true");
    scheduleRestoreGuestFocus();
  }

  function openSettingsPanel() {
    if (!settingsPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    closeTranslatePanel();
    closeAiDrawer();
    if (!findBar.hidden) closeFindBar();
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    hideProfileAddPanel();
    populateSettingsForm();
    settingsPanel.hidden = false;
    settingsPanel.setAttribute("aria-hidden", "false");
    void refreshNebulaAccountSettingsUI();
    void refreshAboutSection();
    void refreshTranslationKeyStatus();
    void refreshAiKeyStatus();
    void refreshSitePermissionSummary();
    queueMicrotask(() => document.getElementById("settings-adblock-enabled")?.focus());
  }

  function toggleSettingsPanel() {
    if (!settingsPanel) return;
    if (settingsPanel.hidden) openSettingsPanel();
    else closeSettingsPanel();
  }

  async function saveSettingsFromForm() {
    const prevForceDark = appSettings.forceDarkMode === true;
    const prevProfileId = appSettings.activeProfileId || "default";
    const patch = gatherSettingsPatchFromForm();
    if (window.nebula?.setSettings) {
      try {
        const next = await window.nebula.setSettings(patch);
        appSettings = normalizeAppSettings(next);
      } catch {
        appSettings = normalizeAppSettings({ ...appSettings, ...patch });
      }
    } else {
      appSettings = normalizeAppSettings({ ...appSettings, ...patch });
    }
    const nextProfileId = appSettings.activeProfileId || "default";
    if (prevProfileId !== nextProfileId) {
      resetAiConversationsForProfileChange();
      if (aiDrawerIsOpen()) ensureAiConversationsOnDrawerOpen();
    }
    syncYoutubeAdSkipAdblockState();
    applyShellAppearance();
    syncChromeLayoutFromSettings();
    renderBookmarksBar();
    if (aiDrawerIsOpen()) {
      syncAiProviderAndModelFromSettings();
      void refreshAiDrawerHint();
    }
    closeSettingsPanel();
    refreshOmniboxSuggestions();
    void refreshTranslationKeyStatus();
    void refreshAiKeyStatus();
    const profileChanged = prevProfileId !== (appSettings.activeProfileId || "default");
    const nextForceDark = appSettings.forceDarkMode === true;
    if (profileChanged && typeof window.nebula?.relaunchApp === "function") {
      void window.nebula.relaunchApp();
      return;
    }
    if (prevForceDark !== nextForceDark && typeof window.nebula?.relaunchApp === "function") {
      if (
        window.confirm(
          "Restart Nebula now to apply forced dark mode for website content? Chromium only applies this at startup."
        )
      ) {
        void window.nebula.relaunchApp();
      }
    }
  }

  function historyShortcutMatch(e) {
    if (e.repeat) return false;
    if (e.key !== "h" && e.key !== "H") return false;
    if (e.altKey) return false;
    if (window.nebula?.isMac) {
      if (e.metaKey && e.shiftKey && !e.ctrlKey) return true;
      if (e.ctrlKey && !e.metaKey) return true;
      return false;
    }
    return e.ctrlKey && !e.shiftKey;
  }

  function printShortcutMatch(e) {
    if (e.repeat) return false;
    if (e.key !== "p" && e.key !== "P") return false;
    if (!e.ctrlKey && !e.metaKey) return false;
    if (e.altKey || e.shiftKey) return false;
    return true;
  }

  function shouldSuppressShellPrintShortcut() {
    if (sessionRestorePanel && !sessionRestorePanel.hidden) return true;
    if (settingsPanel && !settingsPanel.hidden) return true;
    if (vaultPanel && !vaultPanel.hidden) return true;
    if (firstRunPanel && !firstRunPanel.hidden) return true;
    if (permissionPromptPanel && !permissionPromptPanel.hidden) return true;
    if (tabGroupRenamePanel && !tabGroupRenamePanel.hidden) return true;
    const ae = document.activeElement;
    if (aiDrawer && !aiDrawer.hidden && ae && ae.closest && ae.closest("#ai-drawer")) return true;
    return false;
  }

  async function printActivePage() {
    if (shouldSuppressShellPrintShortcut()) return;
    const w = getActiveWebview();
    if (!w || typeof w.getWebContentsId !== "function") {
      alert("Nothing to print.");
      return;
    }
    let wid = 0;
    try {
      wid = w.getWebContentsId() || 0;
    } catch {
      wid = 0;
    }
    if (!wid || !window.nebula?.guestPrint) return;
    try {
      const r = await window.nebula.guestPrint({ guestWebContentsId: wid });
      if (!r?.ok && r?.error) alert(String(r.error));
    } catch {
      alert("Print failed.");
    }
  }

  async function saveActivePageAsPdf() {
    if (shouldSuppressShellPrintShortcut()) return;
    const w = getActiveWebview();
    if (!w || typeof w.getWebContentsId !== "function") {
      alert("Nothing to save.");
      return;
    }
    let wid = 0;
    try {
      wid = w.getWebContentsId() || 0;
    } catch {
      wid = 0;
    }
    if (!wid || !window.nebula?.guestSavePdf) return;
    try {
      const r = await window.nebula.guestSavePdf({ guestWebContentsId: wid });
      if (r?.canceled) return;
      if (!r?.ok) alert(r?.error ? String(r.error) : "Could not save PDF.");
    } catch {
      alert("Could not save PDF.");
    }
  }

  const SITE_PERM_RULE_LABELS = {
    camera: "Camera",
    microphone: "Microphone",
    geolocation: "Location",
    notifications: "Notifications",
    screenCapture: "Screen capture",
    midi: "MIDI",
    thirdPartyCookies: "Third-party cookies",
  };

  function formatSitePermRulesSummary(rules) {
    if (!rules || typeof rules !== "object") return "—";
    const parts = [];
    for (const [k, v] of Object.entries(rules)) {
      if (typeof v !== "string" || !v) continue;
      parts.push(`${SITE_PERM_RULE_LABELS[k] || k}: ${v}`);
    }
    return parts.length ? parts.join(" · ") : "—";
  }

  async function refreshSitePermissionSummary() {
    const emptyEl = document.getElementById("settings-site-perm-summary-empty");
    const wrap = document.getElementById("settings-site-perm-summary-wrap");
    const tbody = document.getElementById("settings-site-perm-summary-tbody");
    if (!emptyEl || !wrap || !tbody) return;
    tbody.replaceChildren();
    emptyEl.textContent = "Loading…";
    emptyEl.hidden = false;
    wrap.hidden = true;
    if (!window.nebula?.listSitePermissionOrigins) {
      emptyEl.textContent = "Site permission list is only available in the Nebula app.";
      emptyEl.hidden = false;
      wrap.hidden = true;
      return;
    }
    try {
      const r = await window.nebula.listSitePermissionOrigins();
      const rows = r && Array.isArray(r.rows) ? r.rows : [];
      if (!rows.length) {
        emptyEl.textContent = "No sites with custom permission rules yet.";
        emptyEl.hidden = false;
        wrap.hidden = true;
        return;
      }
      emptyEl.hidden = true;
      wrap.hidden = false;
      for (const row of rows) {
        const origin = row && typeof row.origin === "string" ? row.origin : "";
        if (!origin) continue;
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.textContent = origin;
        const td2 = document.createElement("td");
        td2.textContent = formatSitePermRulesSummary(row.rules);
        const td3 = document.createElement("td");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "settings-action-btn";
        btn.textContent = "Clear";
        btn.addEventListener("click", async () => {
          if (!confirm(`Remove custom permission rules for\n${origin} ?`)) return;
          try {
            const cr = await window.nebula.clearSitePermissionOrigin(origin);
            if (!cr?.ok) {
              alert((cr && cr.error) || "Could not clear.");
              return;
            }
            void refreshSitePermissionSummary();
            if (sitePermPanel && !sitePermPanel.hidden) void refreshSitePermPanel();
          } catch {
            alert("Could not clear.");
          }
        });
        td3.appendChild(btn);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tbody.appendChild(tr);
      }
    } catch {
      emptyEl.textContent = "Could not load site permission list.";
      emptyEl.hidden = false;
      wrap.hidden = true;
    }
  }

  function loadBookmarksFromStorage() {
    try {
      const key = bookmarksStorageKey();
      let raw = localStorage.getItem(key);
      if (!raw && sanitizeProfileIdForSession(appSettings.activeProfileId) === "default") {
        raw = localStorage.getItem(BOOKMARKS_LEGACY_V2);
        if (raw) {
          try {
            localStorage.setItem(key, raw);
          } catch {
            /* ignore quota */
          }
        }
      }
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr)
        ? arr.filter((x) => x && typeof x.url === "string").map((x) => ({ url: x.url, title: x.title || "" }))
        : [];
    } catch {
      return [];
    }
  }

  function saveBookmarksToStorage() {
    localStorage.setItem(bookmarksStorageKey(), JSON.stringify(bookmarks));
  }

  function normalizeBookmarkUrl(url) {
    try {
      const u = new URL(url);
      u.hash = "";
      return u.href;
    } catch {
      return url;
    }
  }

  function renderBookmarksBar() {
    bookmarksBar.replaceChildren();
    const mode = appSettings.bookmarksBarMode || "auto";
    if (mode === "never") {
      bookmarksBar.hidden = true;
      bookmarksBar.classList.remove("bookmarks-bar--empty-visible");
      return;
    }
    if (bookmarks.length === 0) {
      if (mode === "always") {
        bookmarksBar.hidden = false;
        bookmarksBar.classList.add("bookmarks-bar--empty-visible");
      } else {
        bookmarksBar.hidden = true;
        bookmarksBar.classList.remove("bookmarks-bar--empty-visible");
      }
      return;
    }
    bookmarksBar.classList.remove("bookmarks-bar--empty-visible");
    bookmarksBar.hidden = false;
    for (const b of bookmarks) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "bookmark-chip";
      chip.title = b.url;
      const faviconEl = document.createElement("img");
      faviconEl.className = "bookmark-chip-favicon";
      faviconEl.alt = "";
      faviconEl.width = 16;
      faviconEl.height = 16;
      faviconEl.decoding = "async";
      faviconEl.hidden = true;
      faviconEl.addEventListener("load", () => {
        faviconEl.hidden = false;
      });
      faviconEl.addEventListener("error", () => {
        faviconEl.hidden = true;
        faviconEl.removeAttribute("src");
      });
      const favSrc = bookmarkChipFaviconUrl(b.url);
      if (favSrc) faviconEl.src = favSrc;
      const label = document.createElement("span");
      label.className = "bookmark-chip-title";
      label.textContent = b.title || shortHost(b.url);
      const rm = document.createElement("span");
      rm.className = "bookmark-chip-remove";
      rm.textContent = "\u00D7";
      rm.title = "Remove bookmark";
      rm.addEventListener("click", (ev) => {
        ev.stopPropagation();
        removeBookmarkByUrl(b.url);
      });
      chip.appendChild(faviconEl);
      chip.appendChild(label);
      chip.appendChild(rm);
      chip.addEventListener("click", () => {
        const w = getActiveWebview();
        if (w) w.loadURL(b.url);
        else createTab(b.url);
      });
      bookmarksBar.appendChild(chip);
    }
  }

  function shortHost(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url.slice(0, 24);
    }
  }

  /** https://icons.duckduckgo.com/ip3/ — same idea as omnibox DDG integration; http(s) only. */
  function bookmarkChipFaviconUrl(pageUrl) {
    try {
      const u = new URL(pageUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      const host = u.hostname;
      if (!host) return "";
      return `https://icons.duckduckgo.com/ip3/${host}.ico`;
    } catch {
      return "";
    }
  }

  function removeBookmarkByUrl(url) {
    const key = normalizeBookmarkUrl(url);
    bookmarks = bookmarks.filter((b) => normalizeBookmarkUrl(b.url) !== key);
    saveBookmarksToStorage();
    renderBookmarksBar();
    updateBookmarkStar();
  }

  function isUrlBookmarked(url) {
    if (!url || url.includes(HOME_FILE)) return false;
    const key = normalizeBookmarkUrl(url);
    return bookmarks.some((b) => normalizeBookmarkUrl(b.url) === key);
  }

  function updateBookmarkStar() {
    const w = getActiveWebview();
    let on = false;
    if (w) {
      try {
        on = isUrlBookmarked(w.getURL());
      } catch {
        on = false;
      }
    }
    btnBookmark?.classList.toggle("is-bookmarked", on);
    btnBookmark?.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function toggleBookmarkCurrent() {
    const w = getActiveWebview();
    if (!w) return;
    let url = "";
    let title = "";
    try {
      url = w.getURL();
      title = w.getTitle() || "";
    } catch {
      return;
    }
    if (!url || url.includes(HOME_FILE)) return;
    const key = normalizeBookmarkUrl(url);
    const idx = bookmarks.findIndex((b) => normalizeBookmarkUrl(b.url) === key);
    if (idx >= 0) bookmarks.splice(idx, 1);
    else bookmarks.push({ url, title: title || shortHost(url) });
    saveBookmarksToStorage();
    renderBookmarksBar();
    updateBookmarkStar();
  }

  function mergeImportedBookmarks(imported) {
    const safe = (imported || []).filter((b) => {
      if (!b || typeof b.url !== "string") return false;
      try {
        const u = new URL(b.url);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    });
    const seen = new Set(bookmarks.map((b) => normalizeBookmarkUrl(b.url)));
    let added = 0;
    let skipped = 0;
    for (const b of safe) {
      const key = normalizeBookmarkUrl(b.url);
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      bookmarks.push({ url: b.url, title: b.title || shortHost(b.url) });
      added++;
    }
    saveBookmarksToStorage();
    renderBookmarksBar();
    updateBookmarkStar();
    return { added, skipped, total: safe.length };
  }

  async function readBookmarkListForImportSource(source) {
    const nebula = window.nebula;
    const io = window.NebulaBookmarksIO;
    if (!io) return { ok: false, error: "Bookmark import helper not loaded." };
    if (source === "file") {
      if (!nebula?.readBookmarkImportFile) return { ok: false, error: "Bookmark import is only available in the Nebula app." };
      const r = await nebula.readBookmarkImportFile();
      if (!r || r.canceled) return { ok: false, canceled: true };
      if (!r.ok) return { ok: false, error: r.error ? `Could not read file: ${r.error}` : "Could not read file." };
      try {
        return { ok: true, list: io.parseBookmarkFile(r.content) };
      } catch {
        return { ok: false, error: "Could not parse bookmarks from file." };
      }
    }
    if (source === "chrome" || source === "edge" || source === "firefox") {
      if (!nebula?.readBrowserBookmarks) return { ok: false, error: "Browser import is only available in the Nebula app." };
      const r = await nebula.readBrowserBookmarks(source);
      if (!r || !r.ok) return { ok: false, error: r?.error || "Could not read browser bookmarks." };
      if (Array.isArray(r.bookmarks)) {
        return { ok: true, list: io.parseFlatBookmarkList(r.bookmarks) };
      }
      if (typeof r.content === "string") {
        try {
          return { ok: true, list: io.parseBookmarkFile(r.content) };
        } catch {
          return { ok: false, error: "Could not parse bookmarks from browser export." };
        }
      }
      return { ok: false, error: "Unexpected response from browser bookmark reader." };
    }
    return { ok: false, error: "Unknown import source." };
  }

  async function runBookmarkImport(replace) {
    const nebula = window.nebula;
    const io = window.NebulaBookmarksIO;
    if (!io) {
      alert("Bookmark import helper not loaded.");
      return;
    }
    const source = settingsBookmarksImportSource?.value || "chrome";

    const read = await readBookmarkListForImportSource(source);
    if (read.canceled) return;
    if (!read.ok || !read.list) {
      alert(read.error || "Could not import bookmarks.");
      return;
    }
    const list = read.list;

    if (list.length === 0) {
      alert("No bookmarks found.");
      return;
    }
    const sourceLabel =
      source === "chrome"
        ? "Chrome"
        : source === "edge"
          ? "Edge"
          : source === "firefox"
            ? "Firefox"
            : "the selected file";
    if (replace) {
      const nExisting = bookmarks.length;
      if (
        !confirm(
          `Replace all ${nExisting} Nebula bookmark(s) with up to ${list.length} from ${sourceLabel}?`
        )
      ) {
        return;
      }
      bookmarks = list
        .filter((b) => {
          try {
            const u = new URL(b.url);
            return u.protocol === "http:" || u.protocol === "https:";
          } catch {
            return false;
          }
        })
        .map((b) => ({ url: b.url, title: b.title || shortHost(b.url) }));
      saveBookmarksToStorage();
      renderBookmarksBar();
      updateBookmarkStar();
      alert(`Replaced with ${bookmarks.length} bookmark(s).`);
      return;
    }
    const { added, skipped } = mergeImportedBookmarks(list);
    alert(`Imported ${added} bookmark(s). Skipped ${skipped} duplicate(s).`);
  }

  async function runBookmarkExport(format) {
    const nebula = window.nebula;
    if (!nebula?.saveBookmarkExportFile) {
      alert("Bookmark export is only available in the Nebula app.");
      return;
    }
    const io = window.NebulaBookmarksIO;
    if (!io) {
      alert("Bookmark export helper not loaded.");
      return;
    }
    const defaultPath = format === "json" ? "nebula-bookmarks.json" : "nebula-bookmarks.html";
    const text =
      format === "json" ? io.exportNebulaJson(bookmarks) : io.exportNetscapeHtml(bookmarks);
    const r = await nebula.saveBookmarkExportFile({ format, text, defaultPath });
    if (!r || r.canceled) return;
    if (!r.ok) {
      alert(r.error ? `Could not save: ${r.error}` : "Could not save.");
      return;
    }
    alert(`Saved to ${r.path || "file"}.`);
  }

  function normalizeInput(raw) {
    const t = raw.trim();
    if (!t) return homeUrl();
    if (/^https?:\/\//i.test(t)) return t;
    if (/^file:\/\//i.test(t)) return t;
    if (t.includes(".") && !t.includes(" ") && !t.startsWith("/")) {
      return "https://" + t;
    }
    return "https://duckduckgo.com/?q=" + encodeURIComponent(t);
  }

  function hideOmniboxSuggestions() {
    omniboxSelectedIndex = -1;
    omniboxSuggestionRows = [];
    if (omniboxSuggestTimer) {
      clearTimeout(omniboxSuggestTimer);
      omniboxSuggestTimer = null;
    }
    if (omniboxSuggestions) {
      omniboxSuggestions.hidden = true;
      omniboxSuggestions.replaceChildren();
    }
    urlInput.removeAttribute("aria-activedescendant");
    urlInput.setAttribute("aria-expanded", "false");
  }

  /** True when keyboard focus is still inside the address bar form (input, Go, or suggestion buttons). */
  function isFocusInsideOmniboxWrap() {
    if (!form) return false;
    const ae = document.activeElement;
    if (!ae || !(ae instanceof Node)) return false;
    return form.contains(ae);
  }

  function collectLocalOmniboxSuggestions(rawQuery, skipNavigateUrls, skipDdgQueriesLower) {
    const q = rawQuery.trim().toLowerCase();
    if (q.length === 0) return [];
    const ss = getSearchSettings();
    const skipNav = skipNavigateUrls instanceof Set ? skipNavigateUrls : null;
    const skipQ = skipDdgQueriesLower instanceof Set ? skipDdgQueriesLower : null;

    function navSkipped(url) {
      if (!skipNav || skipNav.size === 0) return false;
      try {
        return skipNav.has(url) || skipNav.has(normalizeBookmarkUrl(url));
      } catch {
        return skipNav.has(url);
      }
    }

    const out = [];
    const seenNav = new Set();
    let nBook = 0;
    let nHist = 0;

    for (const b of bookmarks) {
      if (!ss.enableBookmarks) break;
      if (nBook >= ss.maxBookmarks) break;
      if (navSkipped(b.url)) continue;
      const hay = `${b.title || ""} ${b.url}`.toLowerCase();
      if (!hay.includes(q)) continue;
      let key;
      try {
        key = normalizeBookmarkUrl(b.url);
      } catch {
        key = b.url;
      }
      if (seenNav.has(key)) continue;
      seenNav.add(key);
      nBook += 1;
      out.push({
        navigateUrl: b.url,
        label: b.title || shortHost(b.url),
        sub: b.url,
        badge: "Bookmark",
      });
    }
    const hist = loadHistoryFromStorage();
    for (const h of hist) {
      if (!ss.enableHistory) break;
      if (nHist >= ss.maxHistory) break;
      const dq = extractDuckDuckGoQueryFromUrl(h.url);
      if (dq && skipQ && skipQ.has(dq.toLowerCase())) continue;
      if (navSkipped(h.url)) continue;
      const hay = `${h.title || ""} ${h.url}`.toLowerCase();
      if (!hay.includes(q)) continue;
      let key;
      try {
        key = normalizeBookmarkUrl(h.url);
      } catch {
        key = h.url;
      }
      if (seenNav.has(key)) continue;
      seenNav.add(key);
      nHist += 1;
      out.push({
        navigateUrl: h.url,
        label: h.title || h.url,
        sub: h.url,
        badge: "History",
      });
    }
    return out;
  }

  /** @returns {string | null} decoded search query for DuckDuckGo search URLs */
  function extractDuckDuckGoQueryFromUrl(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.endsWith("duckduckgo.com")) return null;
      const qq = u.searchParams.get("q");
      if (qq == null || !String(qq).trim()) return null;
      return String(qq).trim();
    } catch {
      return null;
    }
  }

  /** Prior searches (DuckDuckGo) from history that match the current omnibox text */
  function collectPastSearchSuggestions(rawQuery) {
    const ss = getSearchSettings();
    if (!ss.enablePastSearch) return [];
    const needle = rawQuery.trim().toLowerCase();
    if (needle.length === 0) return [];
    const hist = loadHistoryFromStorage();
    /** @type {Map<string, { query: string, visitedAt: number }>} */
    const best = new Map();
    for (const h of hist) {
      const queryText = extractDuckDuckGoQueryFromUrl(h.url);
      if (!queryText) continue;
      const low = queryText.toLowerCase();
      if (!low.includes(needle)) continue;
      const prev = best.get(low);
      if (!prev || h.visitedAt > prev.visitedAt) {
        best.set(low, { query: queryText, visitedAt: h.visitedAt });
      }
    }
    const sorted = [...best.values()].sort((a, b) => b.visitedAt - a.visitedAt);
    const out = [];
    for (const { query } of sorted.slice(0, ss.maxPastSearch)) {
      out.push({
        navigateUrl: normalizeInput(query),
        label: query,
        sub: "Past search",
        badge: "Past search",
      });
    }
    return out;
  }

  function mergeOmniboxLayers(pastRows, localRows, remotePhrases) {
    const ss = getSearchSettings();
    const maxTotal = ss.maxTotal;
    const rows = [];
    const seenNav = new Set();
    const seenPhrase = new Set();

    function markUrls(url) {
      seenNav.add(url);
      try {
        seenNav.add(normalizeBookmarkUrl(url));
      } catch {
        /* */
      }
    }

    function tryAddRow(r) {
      if (rows.length >= maxTotal) return false;
      if (seenNav.has(r.navigateUrl)) return false;
      try {
        if (seenNav.has(normalizeBookmarkUrl(r.navigateUrl))) return false;
      } catch {
        /* */
      }
      const pl = r.label.toLowerCase();
      if (seenPhrase.has(pl)) return false;
      rows.push(r);
      markUrls(r.navigateUrl);
      seenPhrase.add(pl);
      return true;
    }

    function addRemote(phrases) {
      if (!phrases || !Array.isArray(phrases) || !ss.enableDuckDuckGo) return;
      const slice = phrases.slice(0, ss.maxDuckDuckGo);
      for (const phrase of slice) {
        if (rows.length >= maxTotal) break;
        const pl = phrase.toLowerCase();
        if (seenPhrase.has(pl)) continue;
        const nav = normalizeInput(phrase);
        if (seenNav.has(nav)) continue;
        try {
          if (seenNav.has(normalizeBookmarkUrl(nav))) continue;
        } catch {
          /* */
        }
        seenPhrase.add(pl);
        markUrls(nav);
        rows.push({
          navigateUrl: nav,
          label: phrase,
          sub: "DuckDuckGo search",
          badge: "Search",
        });
      }
    }

    const pastUse = ss.enablePastSearch ? pastRows : [];
    const localUse = localRows.filter((r) => {
      if (r.badge === "Bookmark" && !ss.enableBookmarks) return false;
      if (r.badge === "History" && !ss.enableHistory) return false;
      return true;
    });

    const byKey = {
      past: pastUse,
      local: localUse,
      remote: remotePhrases,
    };

    for (const key of ss.layerOrder) {
      if (rows.length >= maxTotal) break;
      if (key === "remote") {
        addRemote(byKey.remote);
      } else {
        for (const r of byKey[key]) {
          if (rows.length >= maxTotal) break;
          tryAddRow(r);
        }
      }
    }
    return rows;
  }

  async function fetchDuckDuckGoSuggestions(query) {
    const ss = getSearchSettings();
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].filter((x) => typeof x === "string").slice(0, ss.maxDuckDuckGo);
    }
    return [];
  }

  function renderOmniboxSuggestionsList() {
    if (!omniboxSuggestions) return;
    omniboxSuggestions.replaceChildren();
    if (omniboxSuggestionRows.length === 0) {
      hideOmniboxSuggestions();
      return;
    }
    omniboxSuggestions.hidden = false;
    urlInput.setAttribute("aria-expanded", "true");
    if (omniboxSelectedIndex >= omniboxSuggestionRows.length) {
      omniboxSelectedIndex = omniboxSuggestionRows.length - 1;
    }
    omniboxSuggestionRows.forEach((row, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "presentation");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "omnibox-suggestion" + (i === omniboxSelectedIndex ? " is-active" : "");
      btn.setAttribute("role", "option");
      btn.id = `omnibox-suggest-${i}`;
      btn.setAttribute("aria-selected", i === omniboxSelectedIndex ? "true" : "false");
      const title = document.createElement("span");
      title.className = "omnibox-suggestion-title";
      title.textContent = row.label;
      if (row.badge) {
        const head = document.createElement("div");
        head.className = "omnibox-suggestion-head";
        const badge = document.createElement("span");
        badge.className = "omnibox-suggestion-badge";
        badge.textContent = row.badge;
        head.appendChild(badge);
        head.appendChild(title);
        btn.appendChild(head);
      } else {
        btn.appendChild(title);
      }
      if (row.sub) {
        const sub = document.createElement("span");
        sub.className = "omnibox-suggestion-sub";
        sub.textContent = row.sub;
        btn.appendChild(sub);
      }
      btn.addEventListener("click", () => {
        applyOmniboxSuggestion(i);
      });
      li.appendChild(btn);
      omniboxSuggestions.appendChild(li);
    });
    if (omniboxSelectedIndex >= 0) {
      urlInput.setAttribute("aria-activedescendant", `omnibox-suggest-${omniboxSelectedIndex}`);
    } else {
      urlInput.removeAttribute("aria-activedescendant");
    }
  }

  function applyOmniboxSuggestion(index) {
    const row = omniboxSuggestionRows[index];
    if (!row) return;
    hideOmniboxSuggestions();
    const w = getActiveWebview();
    if (w) w.loadURL(row.navigateUrl);
    else createTab(row.navigateUrl);
  }

  function moveOmniboxSelection(delta) {
    if (omniboxSuggestionRows.length === 0) return;
    const n = omniboxSuggestionRows.length;
    if (omniboxSelectedIndex < 0 && delta > 0) {
      omniboxSelectedIndex = 0;
    } else {
      omniboxSelectedIndex = Math.min(n - 1, Math.max(-1, omniboxSelectedIndex + delta));
    }
    renderOmniboxSuggestionsList();
  }

  function refreshOmniboxSuggestions() {
    if (!omniboxSuggestions) return;
    if (!isFocusInsideOmniboxWrap()) {
      hideOmniboxSuggestions();
      return;
    }
    const raw = urlInput.value;
    const q = raw.trim();
    if (!q) {
      hideOmniboxSuggestions();
      return;
    }

    const past = collectPastSearchSuggestions(raw);
    const skipNav = new Set(past.map((p) => p.navigateUrl));
    const skipQ = new Set(past.map((p) => p.label.toLowerCase()));
    const local = collectLocalOmniboxSuggestions(raw, skipNav, skipQ);
    omniboxSuggestionRows = mergeOmniboxLayers(past, local, null);
    renderOmniboxSuggestionsList();

    if (omniboxSuggestTimer) clearTimeout(omniboxSuggestTimer);

    const ss = getSearchSettings();
    if (!ss.enableDuckDuckGo || q.length < ss.remoteMinChars) {
      return;
    }

    const debouncedQuery = q;
    omniboxSuggestTimer = setTimeout(async () => {
      omniboxSuggestTimer = null;
      const still = urlInput.value.trim();
      if (still !== debouncedQuery || still.length < getSearchSettings().remoteMinChars) return;
      try {
        const remote = await fetchDuckDuckGoSuggestions(still);
        if (!isFocusInsideOmniboxWrap()) return;
        if (urlInput.value.trim() !== still) return;
        const pastFresh = collectPastSearchSuggestions(urlInput.value);
        const skipNavF = new Set(pastFresh.map((p) => p.navigateUrl));
        const skipQF = new Set(pastFresh.map((p) => p.label.toLowerCase()));
        const localFresh = collectLocalOmniboxSuggestions(urlInput.value, skipNavF, skipQF);
        omniboxSuggestionRows = mergeOmniboxLayers(pastFresh, localFresh, remote);
        omniboxSelectedIndex = Math.min(omniboxSelectedIndex, omniboxSuggestionRows.length - 1);
        renderOmniboxSuggestionsList();
      } catch {
        /* offline or blocked */
      }
    }, getSearchSettings().debounceMs);
  }

  async function buildOmniboxRowsForQuery(raw) {
    const q = String(raw ?? "").trim();
    if (!q) return [];
    const ss = getSearchSettings();
    const past = collectPastSearchSuggestions(q);
    const skipNav = new Set(past.map((p) => p.navigateUrl));
    const skipQ = new Set(past.map((p) => p.label.toLowerCase()));
    const local = collectLocalOmniboxSuggestions(q, skipNav, skipQ);
    let rows = mergeOmniboxLayers(past, local, null);
    if (!ss.enableDuckDuckGo || q.length < ss.remoteMinChars) return rows;
    try {
      const remote = await fetchDuckDuckGoSuggestions(q);
      const pastFresh = collectPastSearchSuggestions(q);
      const skipNavF = new Set(pastFresh.map((p) => p.navigateUrl));
      const skipQF = new Set(pastFresh.map((p) => p.label.toLowerCase()));
      const localFresh = collectLocalOmniboxSuggestions(q, skipNavF, skipQF);
      rows = mergeOmniboxLayers(pastFresh, localFresh, remote);
    } catch {
      /* offline */
    }
    return rows;
  }

  window.__nebulaHomeSuggestionsBuild = buildOmniboxRowsForQuery;

  function getActiveWebview() {
    const tab = tabs.find((x) => x.id === activeId);
    return tab ? tab.el : null;
  }

  function shouldDeferWebviewFocusFromWindow() {
    const ae = document.activeElement;
    if (sessionRestorePanel && !sessionRestorePanel.hidden) return true;
    if (passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) return true;
    if (permissionPromptPanel && !permissionPromptPanel.hidden) return true;
    if (changelogPanel && !changelogPanel.hidden) return true;
    if (vaultPanel && !vaultPanel.hidden) return true;
    if (ae === urlInput || ae?.closest?.(".omnibox-wrap")) return true;
    if (settingsPanel && !settingsPanel.hidden) return true;
    if (historyPanel && !historyPanel.hidden) return true;
    if (sitePermPanel && !sitePermPanel.hidden) return true;
    if (translatePanel && !translatePanel.hidden) return true;
    if (aiDrawer && !aiDrawer.hidden) return true;
    if (!findBar.hidden && (ae === findInput || ae?.closest?.("#find-bar"))) return true;
    if (tabGroupRenamePanel && !tabGroupRenamePanel.hidden) return true;
    if (tabCtxMenu && !tabCtxMenu.hidden) return true;
    return false;
  }

  function shouldDeferWebviewFocusFromTabAction() {
    const ae = document.activeElement;
    if (sessionRestorePanel && !sessionRestorePanel.hidden) return true;
    if (passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) return true;
    if (permissionPromptPanel && !permissionPromptPanel.hidden) return true;
    if (changelogPanel && !changelogPanel.hidden) return true;
    if (vaultPanel && !vaultPanel.hidden) return true;
    if (settingsPanel && !settingsPanel.hidden) return true;
    if (historyPanel && !historyPanel.hidden) return true;
    if (sitePermPanel && !sitePermPanel.hidden) return true;
    if (translatePanel && !translatePanel.hidden) return true;
    if (aiDrawer && !aiDrawer.hidden) return true;
    if (ae === urlInput || ae?.closest?.(".omnibox-wrap")) return true;
    if (!findBar.hidden) {
      if (ae === findInput || ae?.closest?.("#find-bar")) return true;
    }
    if (downloadsDock && !downloadsDock.hidden && ae?.closest?.("#downloads-dock")) return true;
    if (updateBanner && !updateBanner.hidden && ae?.closest?.("#update-banner")) return true;
    if (tabGroupRenamePanel && !tabGroupRenamePanel.hidden) return true;
    if (tabCtxMenu && !tabCtxMenu.hidden) return true;
    return false;
  }

  function focusActiveWebviewGuest(options) {
    const forWindow = options && options.forWindow;
    if (forWindow) {
      if (shouldDeferWebviewFocusFromWindow()) return;
    } else if (shouldDeferWebviewFocusFromTabAction()) {
      return;
    }
    const w = getActiveWebview();
    if (!w) return;
    try {
      w.focus();
      const gid = typeof w.getWebContentsId === "function" ? w.getWebContentsId() : 0;
      if (gid > 0 && typeof window.nebula?.focusGuestWebContents === "function") {
        window.setTimeout(() => {
          void window.nebula.focusGuestWebContents(gid);
        }, 0);
      }
    } catch {
      /* guest not ready */
    }
  }

  /** After shell UI or blocking dialogs, Chromium often leaves keyboard focus off the guest until the window blurs. */
  function scheduleRestoreGuestFocus() {
    requestAnimationFrame(() => {
      queueMicrotask(() => {
        if (shouldDeferWebviewFocusFromWindow()) return;
        focusActiveWebviewGuest({ forWindow: true });
      });
    });
  }

  function applySplitRatioStyles() {
    if (!contentMain) return;
    if (!splitPair) {
      contentMain.style.removeProperty("--split-ratio");
      return;
    }
    splitRatioPct = Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, splitRatioPct));
    contentMain.style.setProperty("--split-ratio", `${splitRatioPct}%`);
  }

  function applyWebviewVisibility() {
    if (btnExitSplit) btnExitSplit.hidden = !splitPair;
    if (splitResizer) {
      splitResizer.hidden = !splitPair;
      splitResizer.setAttribute("aria-hidden", splitPair ? "false" : "true");
    }

    if (!splitPair) {
      stack.classList.remove("split-active");
      applySplitRatioStyles();
      for (const t of tabs) {
        const on = t.id === activeId;
        t.tabEl.classList.toggle("active", on);
        t.el.classList.toggle("visible", on);
        t.el.classList.remove("split-pane-left", "split-pane-right");
      }
      return;
    }

    stack.classList.add("split-active");
    applySplitRatioStyles();
    for (const t of tabs) {
      const left = t.id === splitPair.leftId;
      const right = t.id === splitPair.rightId;
      const inSplit = left || right;
      t.el.classList.toggle("visible", inSplit);
      t.el.classList.toggle("split-pane-left", left);
      t.el.classList.toggle("split-pane-right", right);
      t.tabEl.classList.toggle("active", t.id === activeId);
    }
  }

  function exitSplitView() {
    splitPair = null;
    splitRatioPct = 50;
    applyWebviewVisibility();
    syncOmniboxFromWebview();
    setNavButtons();
    updateBookmarkStar();
    syncZoomResetButton();
    updateLoadingUI();
    queueMicrotask(() => focusActiveWebviewGuest());
  }

  function enterSplitView(draggedId, dropSide) {
    if (tabs.length < 2) return;
    let partnerId = activeId;
    if (draggedId === activeId) {
      partnerId = tabs.find((t) => t.id !== draggedId)?.id;
    }
    if (!partnerId || partnerId === draggedId) return;

    const leftId = dropSide === "left" ? draggedId : partnerId;
    const rightId = dropSide === "left" ? partnerId : draggedId;
    splitPair = { leftId, rightId };
    splitRatioPct = 50;
    activeId = draggedId;
    applyWebviewVisibility();
    syncOmniboxFromWebview();
    setNavButtons();
    updateBookmarkStar();
    syncZoomResetButton();
    updateLoadingUI();
    queueMicrotask(() => focusActiveWebviewGuest());
  }

  function showSplitDropZones() {
    if (!splitDropZones || tabs.length < 2) return;
    splitDropZones.hidden = false;
    splitDropZones.setAttribute("aria-hidden", "false");
  }

  function hideSplitDropZones() {
    if (!splitDropZones) return;
    splitDropZones.hidden = true;
    splitDropZones.setAttribute("aria-hidden", "true");
    for (const z of splitDropZones.querySelectorAll(".split-drop--dragover")) {
      z.classList.remove("split-drop--dragover");
    }
  }

  function wireSplitResizer() {
    if (!splitResizer || !stack) return;
    splitResizer.addEventListener("pointerdown", (e) => {
      if (!splitPair || e.button !== 0) return;
      e.preventDefault();
      const pid = e.pointerId;
      try {
        splitResizer.setPointerCapture(pid);
      } catch {
        /* ignore */
      }
      splitResizer.classList.add("is-dragging");

      const onMove = (ev) => {
        if (ev.pointerId !== pid) return;
        const r = stack.getBoundingClientRect();
        if (r.width <= 0) return;
        const x = ev.clientX - r.left;
        let pct = (x / r.width) * 100;
        pct = Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, pct));
        splitRatioPct = pct;
        applySplitRatioStyles();
      };

      const cleanup = () => {
        splitResizer.classList.remove("is-dragging");
        try {
          splitResizer.releasePointerCapture(pid);
        } catch {
          /* ignore */
        }
        splitResizer.removeEventListener("pointermove", onMove);
        splitResizer.removeEventListener("pointerup", cleanup);
        splitResizer.removeEventListener("pointercancel", cleanup);
      };

      splitResizer.addEventListener("pointermove", onMove);
      splitResizer.addEventListener("pointerup", cleanup);
      splitResizer.addEventListener("pointercancel", cleanup);
    });
  }

  function wireSplitDropZones() {
    if (!splitDropZones) return;
    for (const zone of splitDropZones.querySelectorAll("[data-split-drop]")) {
      const side = zone.dataset.splitDrop;
      if (!side) continue;
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        zone.classList.add("split-drop--dragover");
      });
      zone.addEventListener("dragleave", () => {
        zone.classList.remove("split-drop--dragover");
      });
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("split-drop--dragover");
        const draggedId = e.dataTransfer.getData(TAB_DRAG_MIME);
        if (!draggedId) return;
        hideTabReorderIndicator();
        enterSplitView(draggedId, side === "left" ? "left" : "right");
      });
    }
  }

  function setNavButtons() {
    const w = getActiveWebview();
    if (!w) {
      btnBack.disabled = true;
      btnForward.disabled = true;
      return;
    }
    try {
      btnBack.disabled = !w.canGoBack();
      btnForward.disabled = !w.canGoForward();
    } catch {
      btnBack.disabled = true;
      btnForward.disabled = true;
    }
  }

  function syncOmniboxFromWebview() {
    const w = getActiveWebview();
    if (!w) return;
    try {
      const u = w.getURL();
      if (u && u.includes(HOME_FILE)) urlInput.value = "";
      else if (u) urlInput.value = u;
    } catch {
      /* navigating */
    }
    hideOmniboxSuggestions();
  }

  function selectTab(id) {
    if (splitPair && id !== splitPair.leftId && id !== splitPair.rightId) {
      splitPair = null;
      splitRatioPct = 50;
    }
    if (id !== activeId && !findBar.hidden) {
      const prevW = activeId ? tabs.find((t) => t.id === activeId)?.el : null;
      stopFindOnWebview(prevW);
      findBar.hidden = true;
      findInput.value = "";
      findStatus.textContent = "";
    }
    activeId = id;
    applyWebviewVisibility();
    const w = getActiveWebview();
    if (w) {
      try {
        const u = w.getURL();
        urlInput.value = u && u.includes(HOME_FILE) ? "" : u || "";
      } catch {
        urlInput.value = "";
      }
    }
    setNavButtons();
    updateBookmarkStar();
    syncZoomResetButton();
    updateLoadingUI();
    scheduleSaveSessionSnapshot();
    queueMicrotask(() => focusActiveWebviewGuest());
  }

  function removeTab(id) {
    if (splitPair && (splitPair.leftId === id || splitPair.rightId === id)) {
      splitPair = null;
      splitRatioPct = 50;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const tab = tabs[idx];
    stopTranslateInPagePollForTab(tab);
    let closedUrl = homeUrl();
    try {
      closedUrl = tab.el.getURL() || homeUrl();
    } catch {
      /* ignore */
    }
    const closedTitle = tab.titleEl.textContent || "Tab";
    if (!closedUrl.includes(HOME_FILE)) {
      closedTabs.push({ url: closedUrl, title: closedTitle });
      if (closedTabs.length > CLOSED_MAX) closedTabs.shift();
    }

    const gid = tab.guestWcId;
    if (gid && window.nebula?.unregisterGuestMedia) {
      try {
        void window.nebula.unregisterGuestMedia(gid);
      } catch {
        /* ignore */
      }
    }

    tabs.splice(idx, 1);
    if (window.NebulaYoutubeAdSkip && typeof window.NebulaYoutubeAdSkip.stop === "function") {
      try {
        window.NebulaYoutubeAdSkip.stop(tab.el);
      } catch {
        /* ignore */
      }
    }
    tab.el.remove();
    pruneUnusedTabGroups();
    syncTabStripDom();

    if (activeId === id) {
      activeId = null;
      const next = tabs[Math.min(idx, tabs.length - 1)];
      if (next) selectTab(next.id);
      else {
        urlInput.value = "";
        createTab(homeUrl());
      }
    } else {
      applyWebviewVisibility();
      setNavButtons();
      updateBookmarkStar();
      syncZoomResetButton();
      updateLoadingUI();
    }
    scheduleSaveSessionSnapshot();
  }

  function reopenClosedTab() {
    const entry = closedTabs.pop();
    if (!entry) return;
    createTab(entry.url);
  }

  function stopFindOnWebview(wv) {
    if (!wv) return;
    try {
      wv.stopFindInPage("clearSelection");
    } catch {
      /* webview not ready */
    }
  }

  function runFind(text) {
    const w = getActiveWebview();
    if (!w) return;
    const q = String(text).trim();
    if (!q) {
      stopFindOnWebview(w);
      findStatus.textContent = "";
      return;
    }
    try {
      w.findInPage(q, { forward: true });
    } catch {
      /* */
    }
  }

  function findNextMatch() {
    const w = getActiveWebview();
    const q = findInput.value.trim();
    if (!w || !q) return;
    try {
      w.findInPage(q, { forward: true, findNext: true });
    } catch {
      /* */
    }
  }

  function findPrevMatch() {
    const w = getActiveWebview();
    const q = findInput.value.trim();
    if (!w || !q) return;
    try {
      w.findInPage(q, { forward: false, findNext: true });
    } catch {
      /* */
    }
  }

  function openFindBar() {
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    closeTranslatePanel();
    closeAiDrawer();
    findBar.hidden = false;
    findInput.focus();
    findInput.select();
    if (findInput.value.trim()) runFind(findInput.value);
  }

  function closeFindBar() {
    findBar.hidden = true;
    stopFindOnWebview(getActiveWebview());
    findStatus.textContent = "";
    scheduleRestoreGuestFocus();
  }

  let findDebounceTimer = null;

  function zoomInActive() {
    const w = getActiveWebview();
    if (!w) {
      syncZoomResetButton();
      return;
    }
    try {
      const z = Math.min(ZOOM_MAX, w.getZoomFactor() * ZOOM_STEP);
      w.setZoomFactor(z);
    } catch {
      /* */
    }
    syncZoomResetButton();
  }

  function zoomOutActive() {
    const w = getActiveWebview();
    if (!w) {
      syncZoomResetButton();
      return;
    }
    try {
      const z = Math.max(ZOOM_MIN, w.getZoomFactor() / ZOOM_STEP);
      w.setZoomFactor(z);
    } catch {
      /* */
    }
    syncZoomResetButton();
  }

  function zoomResetActive() {
    const w = getActiveWebview();
    if (!w) {
      syncZoomResetButton();
      return;
    }
    try {
      w.setZoomFactor(1);
    } catch {
      /* */
    }
    syncZoomResetButton();
  }

  function syncZoomResetButton() {
    const w = getActiveWebview();
    if (!w) {
      btnZoomReset.hidden = true;
      return;
    }
    try {
      const z = w.getZoomFactor();
      const atDefault = Math.abs(z - 1) < 0.001;
      btnZoomReset.hidden = atDefault;
    } catch {
      btnZoomReset.hidden = true;
    }
  }

  function updateLoadingUI() {
    const w = getActiveWebview();
    let loading = false;
    try {
      loading = !!(w && w.isLoading());
    } catch {
      loading = false;
    }
    if (omniboxEl) omniboxEl.classList.toggle("is-loading", loading);
    btnReload.classList.toggle("is-loading", loading);
    btnReload.title = loading ? "Stop loading" : "Reload";
    btnReload.setAttribute("aria-label", loading ? "Stop loading" : "Reload");
  }

  function reloadOrStopActive() {
    const w = getActiveWebview();
    if (!w) return;
    try {
      if (w.isLoading()) w.stop();
      else w.reload();
    } catch {
      /* */
    }
    queueMicrotask(() => updateLoadingUI());
  }

  function pruneDownloadsDockIfEmpty() {
    if (downloadsDock && downloadElById.size === 0) downloadsDock.hidden = true;
  }

  function removeDownloadRow(id) {
    const row = downloadElById.get(id);
    if (row) {
      row.remove();
      downloadElById.delete(id);
    }
    pruneDownloadsDockIfEmpty();
  }

  function handleDownloadPayload(p) {
    if (!downloadsDock) return;
    if (p.type === "start") {
      downloadsDock.hidden = false;
      const row = document.createElement("div");
      row.className = "download-row";
      row.dataset.downloadId = p.id;

      const nameEl = document.createElement("div");
      nameEl.className = "download-name";
      nameEl.textContent = p.filename;
      nameEl.title = p.filename;

      const bar = document.createElement("div");
      bar.className = "download-bar";
      const fill = document.createElement("div");
      fill.className = "download-bar-fill";
      bar.appendChild(fill);

      const actions = document.createElement("div");
      actions.className = "download-actions";

      row.appendChild(nameEl);
      row.appendChild(bar);
      row.appendChild(actions);

      /** @type {{ fill: HTMLElement, actions: HTMLElement, indeterminate?: boolean }} */
      row._downloadUi = { fill, actions };
      const startPath = p.fullPath || p.path;
      if (startPath) row._nebulaSavedPath = startPath;
      downloadsDock.appendChild(row);
      downloadElById.set(p.id, row);
      return;
    }

    const row = downloadElById.get(p.id);
    if (!row || !row._downloadUi) return;
    const ui = row._downloadUi;

    if (p.type === "progress") {
      const total = p.totalBytes || 0;
      const rec = p.receivedBytes || 0;
      row.classList.remove("download-row--indeterminate");
      if (total > 0) {
        ui.indeterminate = false;
        const pct = Math.min(100, (rec / total) * 100);
        ui.fill.style.width = `${pct}%`;
      } else {
        ui.indeterminate = true;
        row.classList.add("download-row--indeterminate");
        ui.fill.style.width = "100%";
      }
      return;
    }

    if (p.type === "done") {
      const savedPath = p.fullPath || p.path;
      if (savedPath) row._nebulaSavedPath = savedPath;

      row.classList.remove("download-row--indeterminate");
      ui.fill.style.width = p.state === "completed" ? "100%" : ui.fill.style.width;
      row.classList.add("download-row--done");
      row.classList.add(`download-row--${p.state}`);
      ui.actions.replaceChildren();

      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "download-dismiss";
      dismiss.title = "Dismiss";
      dismiss.textContent = "\u00D7";
      dismiss.addEventListener("click", () => removeDownloadRow(p.id));

      if (p.state === "completed" && savedPath && window.nebula?.openPath) {
        const openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "download-action-btn";
        openBtn.textContent = "Open";
        openBtn.addEventListener("click", () => {
          const fp = row._nebulaSavedPath;
          if (fp) void window.nebula.openPath(fp);
        });

        const folderBtn = document.createElement("button");
        folderBtn.type = "button";
        folderBtn.className = "download-action-btn";
        folderBtn.textContent = "Folder";
        folderBtn.addEventListener("click", () => {
          const fp = row._nebulaSavedPath;
          if (fp) void window.nebula.showItemInFolder(fp);
        });

        ui.actions.append(openBtn, folderBtn, dismiss);
      } else {
        const fail = document.createElement("span");
        fail.className = "download-state-msg";
        fail.textContent = p.state === "cancelled" ? "Cancelled" : "Failed";
        ui.actions.append(fail, dismiss);
      }
    }
  }

  const UPDATE_DISMISS_KEY = "nebula-dismissed-update-version";
  let pendingUpdateVersion = "";

  function tabForGuestWc(wid) {
    const n = Number(wid);
    if (!Number.isFinite(n) || n <= 0) return null;
    return tabs.find((t) => t.guestWcId === n) ?? null;
  }

  function renderTabMediaIndicators(entry) {
    if (!entry.muteBtn) return;
    const st = entry.mediaState || {};
    const audible = !!st.audible;
    const muted = !!st.audioMuted;
    const cam = !!st.camera;
    const mic = !!st.microphone;
    const spkOn =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>';
    const spkOff =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    entry.muteBtn.innerHTML = muted ? spkOff : spkOn;
    entry.muteBtn.hidden = !(audible || muted);
    entry.muteBtn.title = muted ? "Unmute tab" : "Mute tab";
    entry.muteBtn.classList.toggle("is-muted", muted);
    entry.muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    if (entry.camBtn) {
      entry.camBtn.hidden = !cam;
    }
    if (entry.micBtn) {
      entry.micBtn.hidden = !mic;
    }
    if (entry.mediaStrip) {
      const any = !entry.muteBtn.hidden || !entry.camBtn.hidden || !entry.micBtn.hidden;
      entry.mediaStrip.hidden = !any;
      entry.mediaStrip.setAttribute("aria-hidden", any ? "false" : "true");
    }
  }

  async function offerUpdateInstall(r) {
    if (!r || !r.updateAvailable) return;
    try {
      if (window.nebula?.promptUpdateInstallChoice) {
        const res = await window.nebula.promptUpdateInstallChoice({
          currentVersion: typeof r.currentVersion === "string" ? r.currentVersion : "",
          latestVersion: typeof r.latestVersion === "string" ? r.latestVersion : "",
          installerUrl: typeof r.installerUrl === "string" ? r.installerUrl : "",
          portableUrl: typeof r.portableUrl === "string" ? r.portableUrl : "",
          releaseUrl: typeof r.releaseUrl === "string" ? r.releaseUrl : "",
        });
        if (res?.choice === "cancel") {
          showUpdateBanner(r);
          return;
        }
        const releaseUrl = typeof res.releaseUrl === "string" ? res.releaseUrl.trim() : "";
        if (res.choice === "portable") {
          const u = (typeof res.portableUrl === "string" ? res.portableUrl.trim() : "") || releaseUrl;
          if (u && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(u);
          return;
        }
        if (res.choice === "installer") {
          const inst = typeof res.installerUrl === "string" ? res.installerUrl.trim() : "";
          if (inst && window.nebula?.startWindowsInstallerUpdate) {
            const r2 = await window.nebula.startWindowsInstallerUpdate({ url: inst });
            if (r2?.ok) return;
            if (r2?.cancelled) {
              if (releaseUrl && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(releaseUrl);
              return;
            }
            const fallback = inst || releaseUrl;
            if (fallback && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(fallback);
            return;
          }
          const open = inst || releaseUrl;
          if (open && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(open);
        }
        return;
      }
    } catch {
      /* */
    }
    const u = typeof r.releaseUrl === "string" ? r.releaseUrl.trim() : "";
    if (u && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(u);
    else showUpdateBanner(r);
  }

  async function runUpdateCheck(verbose) {
    try {
      const r = await window.nebula?.checkForUpdates?.();
      if (!r?.ok) {
        if (verbose) alert(String(r?.reason || "Could not check for updates."));
        return;
      }
      if (r.skipped) {
        if (settingsUpdateHint) {
          settingsUpdateHint.hidden = false;
          settingsUpdateHint.textContent =
            'Add "nebula.updateRepo": "owner/repo" or a GitHub "repository" URL in package.json to enable release checks.';
        }
        if (verbose) {
          alert(
            'Configure updates: set nebula.updateRepo to your GitHub owner/repo (or add a repository URL), rebuild, and try again.'
          );
        }
        return;
      }
      if (settingsUpdateHint) {
        settingsUpdateHint.hidden = true;
        settingsUpdateHint.textContent = "";
      }
      if (r.updateAvailable && typeof r.latestVersion === "string") {
        const dismissed = sessionStorage.getItem(UPDATE_DISMISS_KEY) || "";
        if (dismissed === r.latestVersion) return;
        if (verbose) {
          await offerUpdateInstall(r);
        } else {
          const sk = `nebula-update-offered-${r.latestVersion}`;
          if (sessionStorage.getItem(sk)) {
            showUpdateBanner(r);
          } else {
            await offerUpdateInstall(r);
            sessionStorage.setItem(sk, "1");
          }
        }
      } else if (verbose) {
        alert(`You're up to date (${r.currentVersion || ""}).`);
      }
    } catch {
      if (verbose) alert("Could not check for updates.");
    }
  }

  function showUpdateBanner(r) {
    if (!updateBanner || !updateBannerText) return;
    const cur = typeof r.currentVersion === "string" ? r.currentVersion : "";
    const lat = typeof r.latestVersion === "string" ? r.latestVersion : "";
    pendingUpdateVersion = lat;
    updateBannerText.textContent =
      lat && cur ? `Update available: v${lat} (you have v${cur}).` : "An update is available.";
    updateBanner.hidden = false;
    updateBanner.setAttribute("aria-hidden", "false");
    if (updateBannerDownload) {
      updateBannerDownload.onclick = () => {
        void offerUpdateInstall(r);
      };
    }
  }

  function hideUpdateBanner() {
    if (!updateBanner) return;
    const wasVisible = !updateBanner.hidden;
    updateBanner.hidden = true;
    updateBanner.setAttribute("aria-hidden", "true");
    if (wasVisible) scheduleRestoreGuestFocus();
  }

  const GOOGLE_TRANSLATE_HOST_RE = /(^|\.)translate\.google\.com$/i;

  function ensureTranslateLangSelect() {
    if (!translatePanelLang || translatePanelLang.dataset.nebulaReady === "1") return;
    translatePanelLang.dataset.nebulaReady = "1";
    const frag = document.createDocumentFragment();
    for (const row of TRANSLATE_LANG_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = row.code;
      opt.textContent = row.label;
      frag.appendChild(opt);
    }
    translatePanelLang.appendChild(frag);
    const pref = (navigator.language || "en").replace(/_/g, "-").toLowerCase();
    const codes = new Set(TRANSLATE_LANG_OPTIONS.map((x) => x.code));
    let pick = codes.has(pref) ? pref : "";
    if (!pick && pref.includes("-")) {
      const base = pref.split("-")[0];
      if (codes.has(base)) pick = base;
    }
    if (!pick) pick = "es";
    translatePanelLang.value = pick;
  }

  function translatePanelIsOpen() {
    return !!(translatePanel && !translatePanel.hidden);
  }

  function setTranslatePanelOpen(open) {
    if (!translatePanel || !btnTranslate) return;
    const wasOpen = !translatePanel.hidden;
    translatePanel.hidden = !open;
    btnTranslate.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open && wasOpen) scheduleRestoreGuestFocus();
    if (open) {
      closeAiDrawer();
      closeVpnPanel();
      ensureTranslateLangSelect();
      const hint = document.getElementById("translate-panel-hint");
      if (hint) {
        hint.textContent =
          appSettings.translateEngine === "libre"
            ? "In-page: LibreTranslate (or DeepL if your vault key is set to DeepL). Page stays on this site. Unlock the vault if a key is saved and the vault is locked."
            : "Loads the page through Google Translate. The page URL is sent to Google.";
      }
    }
  }

  function toggleTranslatePanel() {
    setTranslatePanelOpen(!translatePanelIsOpen());
  }

  function closeTranslatePanel() {
    setTranslatePanelOpen(false);
  }

  function ensureVpnProviderList() {
    if (!vpnPanelProviderList || vpnPanelProviderList.dataset.nebulaReady === "1") return;
    vpnPanelProviderList.dataset.nebulaReady = "1";
    vpnPanelProviderList.replaceChildren();
    for (const row of NEBULA_VPN_HELPER_PROVIDERS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vpn-provider-option";
      b.setAttribute("data-provider-id", row.id);
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", "false");
      b.textContent = row.label;
      vpnPanelProviderList.appendChild(b);
    }
  }

  function refreshVpnProviderListSelection() {
    if (!vpnPanelProviderList) return;
    const want = getVpnHelperSelectedProviderId();
    for (const btn of vpnPanelProviderList.querySelectorAll(".vpn-provider-option")) {
      const id = btn.getAttribute("data-provider-id") || "";
      const sel = id === want;
      btn.classList.toggle("is-selected", sel);
      btn.setAttribute("aria-selected", sel ? "true" : "false");
    }
  }

  function refreshVpnPanelFromSettings() {
    ensureVpnProviderList();
    refreshVpnProviderListSelection();
  }

  async function persistVpnRoutingAndNetwork(patch) {
    if (!window.nebula?.setSettings) return;
    try {
      const next = await window.nebula.setSettings(patch);
      appSettings = normalizeAppSettings(next);
    } catch {
      /* */
    }
    refreshVpnPanelFromSettings();
  }

  function vpnPanelIsOpen() {
    return !!(vpnPanel && !vpnPanel.hidden);
  }

  function setVpnPanelOpen(open) {
    if (!vpnPanel || !btnVpn) return;
    const wasOpen = !vpnPanel.hidden;
    vpnPanel.hidden = !open;
    btnVpn.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open && wasOpen) scheduleRestoreGuestFocus();
    if (open) {
      closeTranslatePanel();
      closeAiDrawer();
      ensureVpnProviderList();
      refreshVpnPanelFromSettings();
    }
  }

  function toggleVpnPanel() {
    setVpnPanelOpen(!vpnPanelIsOpen());
  }

  function closeVpnPanel() {
    setVpnPanelOpen(false);
  }

  function isHttpLikePageUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    try {
      const u = new URL(urlStr);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function extractEmbeddedUrlFromGoogleTranslate(currentUrl) {
    try {
      const u = new URL(currentUrl);
      if (!GOOGLE_TRANSLATE_HOST_RE.test(u.hostname)) return "";
      const up = u.searchParams.get("u");
      if (!up) return "";
      return decodeURIComponent(up);
    } catch {
      return "";
    }
  }

  function buildGoogleTranslateWrapUrl(pageUrl, targetLang) {
    const raw = String(targetLang || "en")
      .trim()
      .toLowerCase()
      .replace(/[^a-z-]/g, "");
    const tl = TRANSLATE_LANG_OPTIONS.some((x) => x.code === raw) ? raw : "en";
    return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(tl)}&hl=en&u=${encodeURIComponent(pageUrl)}`;
  }

  function resolveTranslateSourceUrl(tab) {
    if (!tab || !tab.el) return "";
    let cur = "";
    try {
      cur = tab.el.getURL() || "";
    } catch {
      return "";
    }
    if (!cur) return "";
    let host = "";
    try {
      host = new URL(cur).hostname;
    } catch {
      return "";
    }
    if (GOOGLE_TRANSLATE_HOST_RE.test(host)) {
      return extractEmbeddedUrlFromGoogleTranslate(cur) || tab.translateBackUrl || "";
    }
    if (isHttpLikePageUrl(cur) && !isWelcomePageUrl(cur)) return cur;
    return "";
  }

  function stopTranslateInPagePollForTab(tab) {
    if (!tab) return;
    if (tab.translateInPagePollTimer != null) {
      clearInterval(tab.translateInPagePollTimer);
      tab.translateInPagePollTimer = null;
    }
  }

  function startTranslateInPagePollForTab(tab) {
    stopTranslateInPagePollForTab(tab);
    tab.translateInPagePollTimer = window.setInterval(() => {
      void processTranslateInPagePoll(tab);
    }, 550);
  }

  async function processTranslateInPagePoll(tab) {
    if (!tab?.el || !tab.translateInPageActive || activeId !== tab.id) return;
    const w = tab.el;
    let raw;
    try {
      raw = await w.executeJavaScript(
        `(function(){try{return typeof window.__nebulaTrDrainQueue==='function'?window.__nebulaTrDrainQueue():'[]';}catch(e){return'[]'}})()`,
        true
      );
    } catch {
      return;
    }
    let chunk;
    try {
      chunk = JSON.parse(typeof raw === "string" ? raw : String(raw || "[]"));
    } catch {
      return;
    }
    if (!Array.isArray(chunk) || chunk.length === 0) return;
    const texts = chunk.map((c) => (c && typeof c.text === "string" ? c.text : ""));
    const ids = chunk.map((c) => (c && typeof c.id === "number" ? c.id : NaN));
    if (ids.some((x) => !Number.isFinite(x))) return;
    const target = tab.translateInPageTargetLang || translatePanelLang?.value || "en";
    const r = await window.nebula?.translationTranslateTexts?.({ texts, target });
    if (!r || !r.ok || !Array.isArray(r.translated) || r.translated.length !== texts.length) return;
    const pairs = ids.map((id, i) => ({ id, t: String(r.translated[i] ?? "") }));
    const applyJs = buildInpageTranslateIncrementalApplyJs(pairs);
    try {
      await w.executeJavaScript(applyJs, true);
    } catch {
      /* ignore */
    }
  }

  async function runTranslateLibreInPage(tab) {
    const w = tab.el;
    if (!w) return;
    let cur = "";
    try {
      cur = w.getURL() || "";
    } catch {
      return;
    }
    if (!isHttpLikePageUrl(cur) || isWelcomePageUrl(cur)) {
      alert("Open an ordinary http(s) page first (not the home or welcome screen).");
      return;
    }
    if (tab.translateInPageActive) {
      stopTranslateInPagePollForTab(tab);
      try {
        await w.executeJavaScript(INPAGE_TRANSLATE_REVERT_JS, true);
      } catch {
        /* ignore */
      }
      tab.translateInPageActive = false;
    }
    const tl = translatePanelLang?.value || "en";
    let texts;
    try {
      texts = await w.executeJavaScript(INPAGE_TRANSLATE_COLLECT_JS, true);
    } catch {
      alert("Could not read text from this page.");
      return;
    }
    if (!Array.isArray(texts) || texts.length === 0) {
      alert("No translatable text found on this page.");
      return;
    }
    const r = await window.nebula?.translationTranslateTexts?.({ texts, target: tl });
    if (!r || !r.ok) {
      if (r && r.error === "vault_locked") {
        alert("Unlock Saved passwords to use your stored translation API key.");
      } else {
        alert(r && r.error ? String(r.error) : "Translation failed.");
      }
      return;
    }
    const translated = r.translated;
    if (!Array.isArray(translated) || translated.length !== texts.length) {
      alert("Translation returned an unexpected result.");
      return;
    }
    const applyJs = buildInpageTranslateApplyJs(translated);
    try {
      await w.executeJavaScript(applyJs, true);
    } catch {
      alert("Could not apply translation to the page.");
      return;
    }
    let autoOk = false;
    try {
      autoOk = !!(await w.executeJavaScript(INPAGE_TRANSLATE_INSTALL_AUTO_JS, true));
    } catch {
      autoOk = false;
    }
    if (!autoOk) {
      alert("Translation was applied but live updates could not be enabled.");
      tab.translateInPageActive = true;
      tab.translateInPageTargetLang = tl;
      return;
    }
    tab.translateInPageActive = true;
    tab.translateInPageTargetLang = tl;
    startTranslateInPagePollForTab(tab);
  }

  function runTranslateForActiveTab() {
    const tab = tabs.find((t) => t.id === activeId);
    if (!tab || !tab.el) return;
    if (appSettings.translateEngine === "libre") {
      void runTranslateLibreInPage(tab).then(() => closeTranslatePanel());
      return;
    }
    const source = resolveTranslateSourceUrl(tab);
    if (!source || !isHttpLikePageUrl(source)) {
      alert("Open an ordinary http(s) page first (not the home or welcome screen).");
      return;
    }
    const tl = translatePanelLang?.value || "en";
    tab.translateBackUrl = source;
    try {
      tab.el.loadURL(buildGoogleTranslateWrapUrl(source, tl));
    } catch {
      alert("Could not start translation.");
      return;
    }
    closeTranslatePanel();
  }

  function viewOriginalForActiveTab() {
    const tab = tabs.find((t) => t.id === activeId);
    if (!tab || !tab.el) return;
    if (tab.translateInPageActive) {
      stopTranslateInPagePollForTab(tab);
      void (async () => {
        try {
          await tab.el.executeJavaScript(INPAGE_TRANSLATE_REVERT_JS, true);
        } catch {
          /* */
        }
        tab.translateInPageActive = false;
        tab.translateInPageTargetLang = null;
        closeTranslatePanel();
      })();
      return;
    }
    let back = tab.translateBackUrl;
    if (!isHttpLikePageUrl(back)) {
      try {
        back = extractEmbeddedUrlFromGoogleTranslate(tab.el.getURL() || "");
      } catch {
        back = "";
      }
    }
    if (!back || !isHttpLikePageUrl(back)) {
      alert("No original page is available. Open a normal page and use Translate, or go back in history.");
      return;
    }
    tab.translateBackUrl = null;
    try {
      tab.el.loadURL(back);
    } catch {
      alert("Could not open the original page.");
    }
    closeTranslatePanel();
  }

  function createTab(initialUrl, opts) {
    const id = "t" + ++idSeq;
    const url = initialUrl || homeUrl();
    const isPrivate = !!(opts && opts.private);
    const pinned = !!(opts && opts.pinned) && !isPrivate;
    const optGidRaw =
      opts && opts.groupId && typeof opts.groupId === "string" && tabGroups.some((g) => g.id === opts.groupId)
        ? opts.groupId
        : null;
    const optGid = pinned ? null : optGidRaw;
    const inheritedPart =
      opts && typeof opts.partition === "string" && opts.partition.trim() ? opts.partition.trim() : null;
    const guestPartition =
      inheritedPart ||
      (isPrivate
        ? appSettings.incognitoPartition || DEFAULT_APP_SETTINGS.incognitoPartition
        : appSettings.browsingPartition || DEFAULT_APP_SETTINGS.browsingPartition);

    const tabEl = document.createElement("div");
    tabEl.className = "tab";
    tabEl.dataset.tabId = id;
    tabEl.title = isPrivate
      ? "Private tab — cookies and site data are cleared when you close Nebula. Not included in session restore. Drag to reorder…"
      : pinned
        ? "Pinned tab — stays on the left; drag to reorder with other pinned tabs."
        : "Drag to reorder · drop on a group header to join it · drop outside groups to leave · right-click for menu";
    if (isPrivate) tabEl.classList.add("tab--private");
    if (pinned) tabEl.classList.add("tab--pinned");
    const faviconEl = document.createElement("img");
    faviconEl.className = "tab-favicon";
    faviconEl.alt = "";
    faviconEl.width = 16;
    faviconEl.height = 16;
    faviconEl.decoding = "async";
    faviconEl.hidden = true;
    faviconEl.addEventListener("error", () => {
      faviconEl.hidden = true;
      faviconEl.removeAttribute("src");
    });
    const titleEl = document.createElement("span");
    titleEl.className = "tab-title";
    titleEl.textContent = "New tab";

    const mediaStrip = document.createElement("div");
    mediaStrip.className = "tab-media-strip";
    mediaStrip.setAttribute("aria-hidden", "true");

    const muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.className = "tab-media-btn tab-media-mute";
    muteBtn.hidden = true;
    muteBtn.setAttribute("aria-label", "Mute tab");

    const camBtn = document.createElement("button");
    camBtn.type = "button";
    camBtn.className = "tab-media-btn tab-media-cam";
    camBtn.hidden = true;
    camBtn.title = "Turn off camera";
    camBtn.setAttribute("aria-label", "Turn off camera");
    camBtn.innerHTML =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';

    const micBtn = document.createElement("button");
    micBtn.type = "button";
    micBtn.className = "tab-media-btn tab-media-mic";
    micBtn.hidden = true;
    micBtn.title = "Turn off microphone";
    micBtn.setAttribute("aria-label", "Turn off microphone");
    micBtn.innerHTML =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/><path d="M19 11a7 7 0 01-14 0"/><path d="M12 18v3"/></svg>';

    mediaStrip.appendChild(muteBtn);
    mediaStrip.appendChild(camBtn);
    mediaStrip.appendChild(micBtn);

    const entry = {
      id,
      el: null,
      tabEl,
      titleEl,
      faviconEl,
      groupId: optGid,
      guestWcId: null,
      guestPartition,
      isPrivate,
      pinned,
      translateBackUrl: null,
      translateInPageActive: false,
      translateInPagePollTimer: null,
      translateInPageTargetLang: null,
      muteBtn,
      camBtn,
      micBtn,
      mediaStrip,
      mediaState: { audible: false, audioMuted: false, camera: false, microphone: false },
    };

    muteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!entry.guestWcId) return;
      if (!window.nebula?.setGuestAudioMuted) return;
      const next = !entry.mediaState.audioMuted;
      try {
        const r = await window.nebula.setGuestAudioMuted({ guestWebContentsId: entry.guestWcId, muted: next });
        if (r?.ok && typeof r.audioMuted === "boolean") {
          entry.mediaState.audioMuted = r.audioMuted;
          renderTabMediaIndicators(entry);
        }
      } catch {
        /* */
      }
    });
    camBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!entry.guestWcId) return;
      try {
        await window.nebula.stopGuestMediaTracks?.({ guestWebContentsId: entry.guestWcId, kind: "video" });
      } catch {
        /* */
      }
    });
    micBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!entry.guestWcId) return;
      try {
        await window.nebula.stopGuestMediaTracks?.({ guestWebContentsId: entry.guestWcId, kind: "audio" });
      } catch {
        /* */
      }
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "tab-close";
    closeBtn.innerHTML = "\u00D7";
    closeBtn.title = "Close tab";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTab(id);
    });
    tabEl.appendChild(faviconEl);
    tabEl.appendChild(titleEl);
    tabEl.appendChild(mediaStrip);
    tabEl.appendChild(closeBtn);
    tabEl.draggable = true;
    tabEl.addEventListener("dragstart", (e) => {
      if (e.target.closest(".tab-close, .tab-media-btn")) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(TAB_DRAG_MIME, id);
      tabStripReorderActive = true;
      showSplitDropZones();
    });
    tabEl.addEventListener("dragend", () => {
      suppressTabClickUntil = Date.now() + 280;
      hideSplitDropZones();
      hideTabReorderIndicator();
    });
    tabEl.addEventListener("click", (e) => {
      if (Date.now() < suppressTabClickUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      selectTab(id);
    });
    tabEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideTabContextMenu();
      openTabContextMenu(e.clientX, e.clientY, id);
    });

    const el = document.createElement("webview");
    entry.el = el;
    if (isWelcomePageUrl(url)) {
      const pp = getHomePreloadPathForWebview();
      if (pp) el.setAttribute("preload", pp);
    }
    el.setAttribute("src", url);
    el.setAttribute("partition", guestPartition);
    el.setAttribute("allowpopups", "true");
    el.setAttribute("allowfullscreen", "true");
    el.setAttribute(
      "webpreferences",
      "contextIsolation=yes,nodeIntegration=no,sandbox=no,nativeWindowOpen=yes,autoplayPolicy=no-user-gesture-required"
    );
    stack.appendChild(el);

    el.addEventListener("ipc-message", (event) => {
      const ch = event.channel;
      if (ch !== "nebula-login-capture") return;
      const payload = event.args && event.args[0];
      if (!payload || typeof payload !== "object") return;
      considerLoginCaptureForVault(id, payload);
    });

    el.addEventListener("dom-ready", () => {
      try {
        const wid = typeof el.getWebContentsId === "function" ? el.getWebContentsId() : 0;
        if (wid) {
          entry.guestWcId = wid;
          if (window.nebula?.registerGuestWindowOpen) {
            void window.nebula.registerGuestWindowOpen({ guestWebContentsId: wid, partition: guestPartition });
          }
          if (window.nebula?.registerGuestMedia) void window.nebula.registerGuestMedia(wid);
        }
      } catch {
        /* ignore */
      }
    });

    if (window.NebulaYoutubeAdSkip && typeof window.NebulaYoutubeAdSkip.install === "function") {
      window.NebulaYoutubeAdSkip.install(el);
    }

    el.addEventListener("context-menu", (ev) => {
      ev.preventDefault();
      if (!window.nebula?.showWebviewContextMenu) return;
      try {
        const p = ev.params;
        if (!p) return;
        const wid = typeof el.getWebContentsId === "function" ? el.getWebContentsId() : 0;
        const frame = p.frame;
        void window.nebula.showWebviewContextMenu({
          guestWebContentsId: wid,
          linkURL: p.linkURL || "",
          linkText: p.linkText || "",
          pageURL: p.pageURL || "",
          frameURL: p.frameURL || "",
          srcURL: p.srcURL || "",
          mediaType: p.mediaType || "none",
          selectionText: p.selectionText || "",
          isEditable: !!p.isEditable,
          clientX: typeof p.x === "number" ? p.x : undefined,
          clientY: typeof p.y === "number" ? p.y : undefined,
          frameProcessId: frame && typeof frame.processId === "number" ? frame.processId : undefined,
          frameRoutingId: frame && typeof frame.routingId === "number" ? frame.routingId : undefined,
        });
      } catch {
        /* ignore */
      }
    });

    tabs.push(entry);
    syncTabStripDom();

    el.addEventListener("page-favicon-updated", (e) => {
      const favs = e.favicons || (e.detail && e.detail.favicons);
      if (favs && favs.length > 0) {
        faviconEl.src = favs[0];
        faviconEl.hidden = false;
      }
    });
    el.addEventListener("did-start-loading", () => {
      if (activeId === id) updateLoadingUI();
    });
    el.addEventListener("did-stop-loading", () => {
      if (activeId === id) updateLoadingUI();
    });
    el.addEventListener("is-loading-changed", () => {
      if (activeId === id) updateLoadingUI();
    });
    el.addEventListener("page-title-updated", (e) => {
      titleEl.textContent = e.title || "Untitled";
    });
    el.addEventListener("did-navigate", (ev) => {
      const navUrl = typeof ev?.url === "string" ? ev.url : "";
      try {
        const h = new URL(navUrl || "about:blank").hostname;
        if (!GOOGLE_TRANSLATE_HOST_RE.test(h)) {
          entry.translateBackUrl = null;
        }
      } catch {
        entry.translateBackUrl = null;
      }
      stopTranslateInPagePollForTab(entry);
      entry.translateInPageActive = false;
      entry.translateInPageTargetLang = null;
      faviconEl.hidden = true;
      faviconEl.removeAttribute("src");
      if (sessionVaultOfferTimerId != null) {
        clearTimeout(sessionVaultOfferTimerId);
        sessionVaultOfferTimerId = null;
      }
      if (activeId === id && !findBar.hidden) {
        stopFindOnWebview(el);
        findStatus.textContent = "";
      }
      if (activeId === id) {
        syncOmniboxFromWebview();
        setNavButtons();
        updateBookmarkStar();
        if (sitePermPanel && !sitePermPanel.hidden) void refreshSitePermPanel();
      }
      scheduleSaveSessionSnapshot();
    });
    el.addEventListener("did-navigate-in-page", (e) => {
      const u = e.url || "";
      if (u && !shouldSkipHistoryUrl(u) && !entry.isPrivate) {
        recordHistoryVisit(u, titleEl.textContent || "");
      }
      if (activeId === id) {
        syncOmniboxFromWebview();
        setNavButtons();
        updateBookmarkStar();
        if (sitePermPanel && !sitePermPanel.hidden) void refreshSitePermPanel();
      }
      scheduleSaveSessionSnapshot();
    });
    el.addEventListener("found-in-page", (e) => {
      if (activeId !== id || findBar.hidden) return;
      const r = e.result;
      const total = typeof r.matches === "number" ? r.matches : 0;
      const cur = typeof r.activeMatchOrdinal === "number" ? r.activeMatchOrdinal : 0;
      const q = findInput.value.trim();
      if (!q) {
        findStatus.textContent = "";
        return;
      }
      if (total === 0) findStatus.textContent = "No results";
      else findStatus.textContent = `${cur} of ${total}`;
    });
    el.addEventListener("did-finish-load", () => {
      injectWelcomeThemeIntoWebview(el);
      if (activeId === id) {
        syncOmniboxFromWebview();
        setNavButtons();
        updateBookmarkStar();
        syncZoomResetButton();
        updateLoadingUI();
      }
      if (activeId === id && !findBar.hidden && findInput.value.trim()) {
        runFind(findInput.value);
      }
      tryRecordHistoryForTab(id);
      scheduleSessionVaultOfferCheck(id);
    });

    if (!(opts && opts.background)) {
      selectTab(id);
    }
    return entry;
  }

  function isPrivateOrLocalHostnameForAiTab(hostname) {
    const h = String(hostname || "")
      .toLowerCase()
      .trim();
    if (!h) return true;
    if (h === "localhost" || h.endsWith(".localhost")) return true;
    if (h === "0.0.0.0" || h === "::" || h === "[::]" || h === "[::1]" || h === "::1") return true;
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const c = Number(m[3]);
      const d = Number(m[4]);
      if ([a, b, c, d].some((x) => x > 255)) return true;
      if (a === 0 || a === 127) return true;
      if (a === 10) return true;
      if (a === 192 && b === 168) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 100 && b >= 64 && b <= 127) return true;
      if (a === 198 && (b === 18 || b === 19)) return true;
      if (a === 198 && b >= 51 && b <= 55) return true;
      if (a >= 224 && a <= 239) return true;
    }
    if (h.includes(":")) {
      const hc = h.replace(/^\[|\]$/g, "");
      if (hc === "::1") return true;
      const low = hc.toLowerCase();
      if (low.startsWith("fe80:") || low.startsWith("fc") || low.startsWith("fd")) return true;
    }
    return false;
  }

  function validateAiTabAgentUrl(raw) {
    const s = String(raw || "").trim().slice(0, 2048);
    if (!s) return { ok: false, error: "(Empty URL.)" };
    let u;
    try {
      u = new URL(s);
    } catch {
      return { ok: false, error: "(Invalid URL.)" };
    }
    if (u.username || u.password) return { ok: false, error: "(URLs with credentials are not allowed.)" };
    const proto = u.protocol.toLowerCase();
    if (proto !== "http:" && proto !== "https:") return { ok: false, error: "(Only http and https URLs are allowed.)" };
    if (isPrivateOrLocalHostnameForAiTab(u.hostname)) return { ok: false, error: "(That host or IP is not allowed.)" };
    return { ok: true, url: u.href };
  }

  function guestWebContentsIdForAiTabSyncDialog() {
    const w = getActiveWebview();
    if (!w || typeof w.getWebContentsId !== "function") return 0;
    try {
      return w.getWebContentsId() || 0;
    } catch {
      return 0;
    }
  }

  function waitWebviewLoadOnce(wv, timeoutMs) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (success, err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          wv.removeEventListener("did-finish-load", onOk);
        } catch {
          /* */
        }
        try {
          wv.removeEventListener("did-fail-load", onFail);
        } catch {
          /* */
        }
        resolve({ ok: success, error: err || "" });
      };
      const onOk = () => finish(true, "");
      const onFail = (e) => {
        const desc = typeof e?.errorDescription === "string" ? e.errorDescription : "Load failed.";
        finish(false, desc);
      };
      const timer = setTimeout(() => finish(false, "Navigation timed out."), timeoutMs);
      wv.addEventListener("did-finish-load", onOk, { once: true });
      wv.addEventListener("did-fail-load", onFail, { once: true });
    });
  }

  async function waitAfterLoadSettle(wv) {
    const r = await waitWebviewLoadOnce(wv, AI_TAB_AGENT_LOAD_TIMEOUT_MS);
    await new Promise((res) => {
      queueMicrotask(() => setTimeout(res, AI_TAB_AGENT_SETTLE_MS));
    });
    return r;
  }

  async function extractPlainTextFromGuestWebview(wv) {
    if (!wv || typeof wv.executeJavaScript !== "function") return "";
    const cap = AI_TAB_AGENT_TEXT_MAX;
    const expr = `(function(){try{var t=(document.body&&document.body.innerText)?document.body.innerText:(document.documentElement&&document.documentElement.innerText)?document.documentElement.innerText:"";return String(t||"").slice(0,${cap});}catch(_e){return"";}})()`;
    try {
      const t = await wv.executeJavaScript(expr, false);
      return typeof t === "string" ? t : String(t || "");
    } catch {
      return "";
    }
  }

  async function handleAiTabToolMessage(msg) {
    const op = typeof msg.op === "string" ? msg.op : "";
    if (op === "open_browser_tab") {
      const urlRaw = typeof msg.url === "string" ? msg.url : "";
      const activate = msg.activate === true;
      const wantConfirm = msg.confirmNavigation !== false;
      const v = validateAiTabAgentUrl(urlRaw);
      if (!v.ok) return { ok: false, error: v.error };
      if (wantConfirm && typeof window.nebula?.syncDialog === "function") {
        const ok = !!window.nebula.syncDialog({
          kind: "confirm",
          message: `The AI assistant wants to open this page in a new tab:\n\n${v.url}\n\nAllow navigation?`,
          guestWebContentsId: guestWebContentsIdForAiTabSyncDialog(),
        });
        if (!ok) return { ok: false, error: "User declined opening this URL in a tab." };
      }
      const entry = createTab(v.url, { private: false, background: !activate });
      const wv = entry.el;
      const loadRes = await waitAfterLoadSettle(wv);
      if (!loadRes.ok) {
        return { ok: false, error: loadRes.error || "Failed to load page.", tabId: entry.id };
      }
      let pageUrl = "";
      let title = "";
      try {
        pageUrl = wv.getURL() || "";
        title = wv.getTitle() || entry.titleEl.textContent || "";
      } catch {
        title = entry.titleEl.textContent || "";
      }
      const text = await extractPlainTextFromGuestWebview(wv);
      if (activate) selectTab(entry.id);
      return { ok: true, tabId: entry.id, url: pageUrl, title, text };
    }
    if (op === "read_browser_tab_text") {
      const rawTabId = typeof msg.tab_id === "string" ? msg.tab_id.trim() : "";
      const tid = rawTabId || activeId;
      const tab = tabs.find((x) => x.id === tid);
      if (!tab || !tab.el) return { ok: false, error: "Tab not found or has no webview." };
      let pageUrl = "";
      try {
        pageUrl = tab.el.getURL() || "";
      } catch {
        pageUrl = "";
      }
      if (!isHttpLikePageUrl(pageUrl) || isWelcomePageUrl(pageUrl)) {
        return { ok: false, error: "That tab is not a readable http(s) page (e.g. new tab or non-web URL)." };
      }
      let title = "";
      try {
        title = tab.el.getTitle() || tab.titleEl.textContent || "";
      } catch {
        title = tab.titleEl.textContent || "";
      }
      const text = await extractPlainTextFromGuestWebview(tab.el);
      return { ok: true, tabId: tab.id, url: pageUrl, title, text };
    }
    return { ok: false, error: "Unknown tab tool operation." };
  }

  async function addSessionVaultPlaceholderFromMenu() {
    const w = getActiveWebview();
    if (!w) return;
    let pageUrl = "";
    let title = "";
    try {
      pageUrl = w.getURL() || "";
      title = w.getTitle() || "";
    } catch {
      return;
    }
    if (!/^https:\/\//i.test(pageUrl)) {
      alert("Open an HTTPS page first.");
      return;
    }
    try {
      const r = await window.nebula?.vaultAddSessionPlaceholder?.({
        pageUrl,
        title,
        skipCookieCheck: true,
      });
      if (r?.ok) {
        if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
        return;
      }
      if (r?.error === "exists") {
        alert("This site is already in your saved passwords.");
        return;
      }
      if (r?.error === "login_page") {
        alert("This URL looks like a sign-in page. Open the site after you are logged in, then try again.");
        return;
      }
      alert("Could not add this site.");
    } catch {
      alert("Could not add this site.");
    }
  }

  function speakPlainTextAloud(raw) {
    if (typeof window.speechSynthesis === "undefined") {
      alert("Speech is not available in this environment.");
      return;
    }
    const t = typeof raw === "string" ? raw.trim() : String(raw || "").trim();
    if (!t) {
      alert("Nothing to read.");
      return;
    }
    let spoken = t;
    if (spoken.length > READ_ALOUD_MAX_CHARS) {
      spoken = spoken.slice(0, READ_ALOUD_MAX_CHARS) + "…";
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spoken);
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch {
      alert("Could not start speech.");
    }
  }

  function readSelectionAloud() {
    if (typeof window.speechSynthesis === "undefined") {
      alert("Speech is not available in this environment.");
      return;
    }
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        return;
      }
    } catch {
      /* */
    }
    const guest = getActiveWebview();
    if (!guest) return;
    void (async () => {
      let text = "";
      try {
        const raw = await guest.executeJavaScript(READ_SELECTION_JS, true);
        text = typeof raw === "string" ? raw.trim() : String(raw || "").trim();
      } catch {
        alert("Could not read the selection from this page.");
        return;
      }
      if (!text) {
        alert("No text selected. Select something on the page first.");
        return;
      }
      speakPlainTextAloud(text);
    })();
  }

  function handleAction(action) {
    const w = getActiveWebview();
    switch (action) {
      case "new-tab":
        createTab(homeUrl());
        break;
      case "new-private-tab":
        createTab(homeUrl(), { private: true });
        break;
      case "close-tab":
        if (activeId) removeTab(activeId);
        break;
      case "reopen-tab":
        reopenClosedTab();
        break;
      case "toggle-pin-tab":
        togglePinTabForActive();
        break;
      case "back":
        if (w && w.canGoBack()) w.goBack();
        break;
      case "forward":
        if (w && w.canGoForward()) w.goForward();
        break;
      case "home":
        if (w) w.loadURL(homeUrl());
        break;
      case "reload":
        reloadOrStopActive();
        break;
      case "picture-in-picture":
        void (async () => {
          const guest = getActiveWebview();
          if (!guest) return;
          let wid = 0;
          try {
            wid = typeof guest.getWebContentsId === "function" ? guest.getWebContentsId() : 0;
          } catch {
            wid = 0;
          }
          if (!wid || !window.nebula?.requestPictureInPicture) return;
          try {
            const r = await window.nebula.requestPictureInPicture({ guestWebContentsId: wid });
            if (r && r.ok) return;
            const reason = r && typeof r.reason === "string" ? r.reason : "";
            if (reason === "no-video") return;
            if (reason) alert(`Picture in picture: ${reason}`);
          } catch {
            /* */
          }
        })();
        break;
      case "read-selection-aloud":
        readSelectionAloud();
        break;
      case "focus-omnibox":
        urlInput.focus();
        urlInput.select();
        break;
      case "toggle-bookmark":
        toggleBookmarkCurrent();
        break;
      case "find-in-page":
        openFindBar();
        break;
      case "print-page":
        void printActivePage();
        break;
      case "save-page-pdf":
        void saveActivePageAsPdf();
        break;
      case "show-history":
        toggleHistoryPanel();
        break;
      case "show-site-permissions":
        toggleSitePermissionsPanel();
        break;
      case "show-password-manager":
        toggleVaultPanel();
        break;
      case "add-session-vault-placeholder":
        void addSessionVaultPlaceholderFromMenu();
        break;
      case "open-settings":
        openSettingsPanel();
        break;
      case "check-for-updates":
        void runUpdateCheck(true);
        break;
      case "zoom-in":
        zoomInActive();
        break;
      case "zoom-out":
        zoomOutActive();
        break;
      case "zoom-reset":
        zoomResetActive();
        break;
      default:
        break;
    }
  }

  btnBack.addEventListener("click", () => {
    const w = getActiveWebview();
    if (w && w.canGoBack()) w.goBack();
  });
  btnForward.addEventListener("click", () => {
    const w = getActiveWebview();
    if (w && w.canGoForward()) w.goForward();
  });
  btnReload.addEventListener("click", () => reloadOrStopActive());
  btnHome.addEventListener("click", () => {
    const w = getActiveWebview();
    if (w) w.loadURL(homeUrl());
  });
  function openNewTabFromChrome() {
    createTab(homeUrl());
  }
  btnNewTab.addEventListener("click", openNewTabFromChrome);
  btnNewTabStrip?.addEventListener("click", openNewTabFromChrome);
  btnZoomReset.addEventListener("click", () => zoomResetActive());
  btnBookmark.addEventListener("click", () => toggleBookmarkCurrent());
  btnTranslate?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTranslatePanel();
  });
  btnVpn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleVpnPanel();
  });
  vpnPanelProviderList?.addEventListener("click", (e) => {
    const btn = e.target instanceof Element ? e.target.closest(".vpn-provider-option") : null;
    if (!btn || !vpnPanelProviderList.contains(btn)) return;
    e.stopPropagation();
    const sid = String(btn.getAttribute("data-provider-id") || "none");
    const vh0 = normalizeAppVpnHelper(appSettings.vpnHelper || {});
    void persistVpnRoutingAndNetwork({ vpnHelper: { ...vh0, selectedProviderId: sid } });
  });
  function openVpnDownloadForSelected() {
    const sid = getVpnHelperSelectedProviderId();
    const prov = NEBULA_VPN_HELPER_PROVIDERS.find((p) => p.id === sid);
    if (!prov || !prov.downloadUrl) {
      alert("Pick a provider with a download link.");
      return;
    }
    const useNebula = !!confirm(
      "Open this official download page in a new Nebula tab?\n\nOK = Nebula tab\nCancel = your default system browser"
    );
    const vh0 = normalizeAppVpnHelper(appSettings.vpnHelper || {});
    void persistVpnRoutingAndNetwork({ vpnHelper: { ...vh0, lastDownloadChoice: useNebula ? "nebula" : "external" } });
    if (useNebula) createTab(prov.downloadUrl);
    else if (window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(prov.downloadUrl);
  }
  vpnPanelOpenApp?.addEventListener("click", (e) => {
    e.stopPropagation();
    void (async () => {
      const sid = getVpnHelperSelectedProviderId();
      if (sid === "none") {
        alert("Pick a provider first.");
        return;
      }
      if (typeof window.nebula?.vpnHelperOpenApp !== "function") return;
      const r = await window.nebula.vpnHelperOpenApp(sid);
      if (r?.ok) return;
      const msg = r && r.error ? String(r.error) : "Could not start the VPN app.";
      if (confirm(`${msg}\n\nOpen the official download page?`)) openVpnDownloadForSelected();
    })();
  });
  vpnPanelDownload?.addEventListener("click", (e) => {
    e.stopPropagation();
    openVpnDownloadForSelected();
  });
  btnAi?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAiDrawer();
  });
  aiDrawerClose?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAiDrawer();
  });
  aiProvider?.addEventListener("change", () => {
    const v =
      aiProvider.value === "anthropic" ? "anthropic" : aiProvider.value === "google" ? "google" : "openai";
    void persistAiAssistantPatch({ activeProvider: v });
  });
  aiModel?.addEventListener("change", () => {
    const provider =
      aiProvider.value === "anthropic" ? "anthropic" : aiProvider.value === "google" ? "google" : "openai";
    const model = String(aiModel.value || "").trim();
    if (!model) return;
    void persistAiAssistantPatch({ modelByProvider: { [provider]: model } });
  });
  aiConversationSelect?.addEventListener("change", () => {
    const id = String(aiConversationSelect.value || "").trim();
    if (!id || id === activeAiConversationId) return;
    openAiConversationById(id);
  });
  aiConvNewBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    startNewAiConversation();
  });
  aiConvSaveBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    persistCurrentAiConversation();
  });
  aiConvDeleteBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteActiveAiConversation();
  });
  aiSendBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    void aiSendUserMessage();
  });
  aiSummarizeTabBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    void aiSummarizeCurrentTab();
  });
  aiClearBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    removeAiStreamBubble();
    setAiThinkingVisible(false);
    aiChatMessages = [];
    renderAiMessageBubbles();
    persistCurrentAiConversation();
  });
  aiAddModelBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    void (async () => {
      const id = String(aiAddModelInput?.value || "").trim().slice(0, 128);
      if (!id) {
        alert("Enter a model id first.");
        return;
      }
      const provider =
        aiProvider.value === "anthropic" ? "anthropic" : aiProvider.value === "google" ? "google" : "openai";
      const base = appSettings.aiAssistant && typeof appSettings.aiAssistant === "object" ? appSettings.aiAssistant : DEFAULT_AI_ASSISTANT_APP;
      const cur = [...(base.customModelsByProvider?.[provider] || [])];
      if (cur.includes(id)) {
        alert("That model id is already in your list.");
        return;
      }
      if (cur.length >= 24) {
        alert("You can add at most 24 custom model ids per provider.");
        return;
      }
      cur.push(id);
      await persistAiAssistantPatch({ customModelsByProvider: { [provider]: cur } });
      if (aiAddModelInput) aiAddModelInput.value = "";
    })();
  });
  aiInput?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    void aiSendUserMessage();
  });
  translatePanelGo?.addEventListener("click", (e) => {
    e.stopPropagation();
    runTranslateForActiveTab();
  });
  translatePanelOriginal?.addEventListener("click", (e) => {
    e.stopPropagation();
    viewOriginalForActiveTab();
  });
  /**
   * True if the event originated inside `container`, including UA shadow targets
   * (e.g. checkbox or select internals where `target` is not a light-DOM descendant).
   */
  function eventPathIncludesContainer(container, ev) {
    if (!container) return false;
    const t = ev.target;
    if (t instanceof Node && container.contains(t)) return true;
    if (typeof ev.composedPath === "function") {
      try {
        const path = ev.composedPath();
        for (let i = 0; i < path.length; i++) {
          const n = path[i];
          if (n === container) return true;
          if (n instanceof Node && container.contains(n)) return true;
        }
      } catch {
        /* */
      }
    }
    return false;
  }
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!translatePanelIsOpen()) return;
      if (eventPathIncludesContainer(translateDropdownWrap, e)) return;
      closeTranslatePanel();
    },
    true
  );
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!vpnPanelIsOpen()) return;
      if (eventPathIncludesContainer(vpnDropdownWrap, e)) return;
      closeVpnPanel();
    },
    true
  );
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!aiDrawerIsOpen()) return;
      if (eventPathIncludesContainer(aiToolbarWrap, e)) return;
      if (eventPathIncludesContainer(aiDrawer, e)) return;
      closeAiDrawer();
    },
    true
  );
  if (btnExitSplit) {
    btnExitSplit.addEventListener("click", () => exitSplitView());
  }

  stack.addEventListener(
    "mousedown",
    (e) => {
      const el = e.target;
      if (!el || el.tagName !== "WEBVIEW") return;
      const tab = tabs.find((t) => t.el === el);
      if (!tab) return;
      if (
        splitPair &&
        (tab.id === splitPair.leftId || tab.id === splitPair.rightId) &&
        activeId !== tab.id
      ) {
        selectTab(tab.id);
      }
      try {
        el.focus();
      } catch {
        /* */
      }
    },
    true
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (omniboxSelectedIndex >= 0 && omniboxSuggestionRows[omniboxSelectedIndex]) {
      applyOmniboxSuggestion(omniboxSelectedIndex);
      return;
    }
    const w = getActiveWebview();
    const target = normalizeInput(urlInput.value);
    if (w) w.loadURL(target);
    else createTab(target);
  });

  form.addEventListener("mousedown", (e) => {
    if (e.target.closest?.(".omnibox-suggestion")) e.preventDefault();
  });

  form.addEventListener("focusout", (e) => {
    const next = e.relatedTarget;
    if (next && form.contains(next)) return;
    hideOmniboxSuggestions();
  });

  if (btnSettings) {
    btnSettings.addEventListener("click", () => openSettingsPanel());
  }
  settingsPanelClose?.addEventListener("click", () => closeSettingsPanel());
  settingsPanelBackdrop?.addEventListener("click", () => closeSettingsPanel());
  settingsSaveBtn?.addEventListener("click", () => void saveSettingsFromForm());
  settingsProfileAdd?.addEventListener("click", () => showProfileAddPanel());
  settingsProfileAddCancel?.addEventListener("click", () => hideProfileAddPanel());
  settingsProfileAddConfirm?.addEventListener("click", () => void commitNewProfileFromInput());
  settingsProfileNewName?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void commitNewProfileFromInput();
    } else if (e.key === "Escape") {
      e.preventDefault();
      hideProfileAddPanel();
    }
  });
  settingsProfileRemove?.addEventListener("click", () => {
    const sel = settingsProfileSelect;
    const rid = sel && typeof sel.value === "string" ? sel.value.trim().toLowerCase() : "";
    if (!rid || rid === "default") {
      alert("The Default profile cannot be removed.");
      return;
    }
    const profiles = (appSettings.profiles || []).filter((p) => p && p.id !== rid);
    if (profiles.length === (appSettings.profiles || []).length) return;
    if (!window.confirm(`Remove browsing profile “${rid}” from the list? Its data folder stays on disk until you delete it manually from Nebula’s userData Partitions.`)) return;
    void (async () => {
      const wasActiveRemoved = (appSettings.activeProfileId || "default") === rid;
      const patch = { profiles };
      if (wasActiveRemoved) patch.activeProfileId = "default";
      if (window.nebula?.setSettings) {
        try {
          const next = await window.nebula.setSettings(patch);
          appSettings = normalizeAppSettings(next);
        } catch {
          appSettings = normalizeAppSettings({ ...appSettings, ...patch });
        }
      } else {
        appSettings = normalizeAppSettings({ ...appSettings, ...patch });
      }
      if (wasActiveRemoved) {
        resetAiConversationsForProfileChange();
        if (aiDrawerIsOpen()) ensureAiConversationsOnDrawerOpen();
      }
      populateSettingsForm();
    })();
  });
  document.getElementById("settings-translate-save-key")?.addEventListener("click", async () => {
    const keyEl = document.getElementById("settings-translate-api-key");
    const key = keyEl?.value?.trim() || "";
    const prov = document.getElementById("settings-translate-key-provider")?.value || "libre";
    if (!key) {
      alert("Paste an API key first.");
      return;
    }
    const r = await window.nebula?.translationSaveKey?.({ apiKey: key, provider: prov });
    if (r?.locked) {
      alert("Unlock Saved passwords first.");
      return;
    }
    if (r?.ok) {
      if (keyEl) keyEl.value = "";
      void refreshTranslationKeyStatus();
    }
  });
  document.getElementById("settings-translate-clear-key")?.addEventListener("click", async () => {
    if (!confirm("Remove the translation API key from the vault?")) return;
    const r = await window.nebula?.translationSaveKey?.({ apiKey: "", provider: "libre" });
    if (r?.ok) void refreshTranslationKeyStatus();
  });

  async function settingsAiSaveKey(provider) {
    const ids = {
      openai: "settings-ai-key-openai",
      anthropic: "settings-ai-key-anthropic",
      google: "settings-ai-key-google",
      "brave-search": "settings-ai-key-brave-search",
    };
    const keyEl = document.getElementById(ids[provider] || "settings-ai-key-openai");
    const key = keyEl?.value?.trim() || "";
    if (!key) {
      alert("Paste an API key first.");
      return;
    }
    const r = await window.nebula?.aiSaveKey?.({ apiKey: key, provider });
    if (r?.locked) {
      alert("Unlock Saved passwords first.");
      return;
    }
    if (r?.ok) {
      if (keyEl) keyEl.value = "";
      void refreshAiKeyStatus();
      if (aiDrawerIsOpen()) void refreshAiDrawerHint();
    }
  }

  document.getElementById("settings-ai-save-openai")?.addEventListener("click", () => void settingsAiSaveKey("openai"));
  document.getElementById("settings-ai-save-anthropic")?.addEventListener("click", () => void settingsAiSaveKey("anthropic"));
  document.getElementById("settings-ai-save-google")?.addEventListener("click", () => void settingsAiSaveKey("google"));
  document.getElementById("settings-ai-save-brave-search")?.addEventListener("click", () => void settingsAiSaveKey("brave-search"));
  document.getElementById("settings-ai-clear-openai")?.addEventListener("click", async () => {
    if (!confirm("Remove the OpenAI API key from the vault?")) return;
    const r = await window.nebula?.aiSaveKey?.({ apiKey: "", provider: "openai" });
    if (r?.ok) {
      void refreshAiKeyStatus();
      if (aiDrawerIsOpen()) void refreshAiDrawerHint();
    }
  });
  document.getElementById("settings-ai-clear-anthropic")?.addEventListener("click", async () => {
    if (!confirm("Remove the Anthropic API key from the vault?")) return;
    const r = await window.nebula?.aiSaveKey?.({ apiKey: "", provider: "anthropic" });
    if (r?.ok) {
      void refreshAiKeyStatus();
      if (aiDrawerIsOpen()) void refreshAiDrawerHint();
    }
  });
  document.getElementById("settings-ai-clear-google")?.addEventListener("click", async () => {
    if (!confirm("Remove the Gemini API key from the vault?")) return;
    const r = await window.nebula?.aiSaveKey?.({ apiKey: "", provider: "google" });
    if (r?.ok) {
      void refreshAiKeyStatus();
      if (aiDrawerIsOpen()) void refreshAiDrawerHint();
    }
  });
  document.getElementById("settings-ai-clear-brave-search")?.addEventListener("click", async () => {
    if (!confirm("Remove the Brave Search API key from the vault?")) return;
    const r = await window.nebula?.aiSaveKey?.({ apiKey: "", provider: "brave-search" });
    if (r?.ok) {
      void refreshAiKeyStatus();
      if (aiDrawerIsOpen()) void refreshAiDrawerHint();
    }
  });

  settingsBookmarksImportMerge?.addEventListener("click", () => void runBookmarkImport(false));
  settingsBookmarksImportReplace?.addEventListener("click", () => void runBookmarkImport(true));
  settingsBookmarksExportHtml?.addEventListener("click", () => void runBookmarkExport("html"));
  settingsBookmarksExportJson?.addEventListener("click", () => void runBookmarkExport("json"));
  settingsOpenChangelog?.addEventListener("click", () => void openChangelogPanel());
  changelogPanelClose?.addEventListener("click", () => closeChangelogPanel());
  changelogPanelBackdrop?.addEventListener("click", () => closeChangelogPanel());

  permissionPromptAllow?.addEventListener("click", () => finishPermissionPrompt(true));
  permissionPromptBlock?.addEventListener("click", () => finishPermissionPrompt(false));
  permissionPromptBackdrop?.addEventListener("click", () => rejectActivePermissionIfAny());

  passwordSaveOfferSave?.addEventListener("click", () => void confirmPasswordSaveOffer());
  passwordSaveOfferDismiss?.addEventListener("click", () => closePasswordSaveOfferPanel());
  passwordSaveOfferNever?.addEventListener("click", () => {
    const cur = activeSaveOffer;
    const o = cur?.origin;
    if (typeof o === "string" && o) {
      if (cur?.kind === "session") persistSessionVaultDenyOrigin(o);
      else persistPasswordSaveDenyOrigin(o);
    }
    closePasswordSaveOfferPanel();
  });
  passwordSaveOfferBackdrop?.addEventListener("click", () => closePasswordSaveOfferPanel());

  vaultPanelClose?.addEventListener("click", () => closeVaultPanel());
  vaultPanelBackdrop?.addEventListener("click", () => closeVaultPanel());
  vaultSearchInput?.addEventListener("input", () => renderVaultList());
  vaultFilter?.addEventListener("change", () => {
    vaultListFilter = /** @type {typeof vaultListFilter} */ (vaultFilter.value || "all");
    renderVaultList();
  });
  vaultExportBtn?.addEventListener("click", async () => {
    try {
      const includePw = vaultExportIncludePasswords?.checked !== false;
      const r = await window.nebula?.vaultExportJsonFile?.({ includePasswords: includePw });
      if (r?.locked) {
        void loadVaultEntriesFromMain();
        if (vaultHintEncryption) {
          vaultHintEncryption.textContent =
            "Unlock the vault before exporting (full export includes passwords; you can still export an outline without them after unlock).";
        }
        return;
      }
      if (r?.ok && typeof r.count === "number" && vaultHintEncryption) {
        const p = typeof r.path === "string" ? r.path : "";
        const red = r.redacted === true ? " (passwords omitted)" : "";
        vaultHintEncryption.textContent = `Exported ${r.count} ${r.count === 1 ? "entry" : "entries"}${red}${p ? ` to ${p}` : ""}.`;
        window.setTimeout(() => void refreshVaultHint(), 4000);
      } else if (r && !r.canceled && r.error) {
        alert(String(r.error));
      }
    } catch {
      /* */
    }
  });
  vaultImportBtn?.addEventListener("click", async () => {
    try {
      const mode = vaultImportMode?.value === "replace" ? "replace" : "merge";
      if (mode === "replace") {
        const ok = window.confirm(
          "Replace every saved password in Nebula with this file? Entries not in the file are removed. This cannot be undone."
        );
        if (!ok) return;
      }
      const r = await window.nebula?.vaultImportJsonMerge?.({ mode });
      if (r?.locked) {
        void loadVaultEntriesFromMain();
        if (vaultHintEncryption) {
          vaultHintEncryption.textContent = "Unlock the vault before importing (imports can add or replace passwords).";
        }
        return;
      }
      if (r?.ok) {
        await loadVaultEntriesFromMain();
        if (vaultHintEncryption) {
          const a = typeof r.added === "number" ? r.added : 0;
          const s = typeof r.skipped === "number" ? r.skipped : 0;
          if (r.mode === "replace") {
            vaultHintEncryption.textContent = `Import complete: vault replaced with ${a} ${a === 1 ? "entry" : "entries"} (${s} invalid rows skipped).`;
          } else {
            vaultHintEncryption.textContent = `Import complete: added ${a}, skipped ${s} (duplicate origin+username or invalid rows).`;
          }
          window.setTimeout(() => void refreshVaultHint(), 4500);
        }
      } else if (r && !r.canceled && r.error) {
        alert(String(r.error));
      }
    } catch {
      /* */
    }
  });
  vaultAddToggle?.addEventListener("click", () => {
    if (!vaultFormWrap) return;
    const show = vaultFormWrap.hidden;
    vaultFormWrap.hidden = !show;
    if (!vaultFormWrap.hidden) {
      resetVaultForm();
      queueMicrotask(() => vaultFieldUrl?.focus());
    }
  });
  vaultFormCancel?.addEventListener("click", () => {
    if (vaultFormWrap) vaultFormWrap.hidden = true;
    resetVaultForm();
  });
  vaultFormSave?.addEventListener("click", async () => {
    const url = vaultFieldUrl?.value?.trim() || "";
    const username = vaultFieldUser?.value ?? "";
    const password = vaultFieldPass?.value ?? "";
    if (!url || !username) {
      alert("Enter at least a website URL and username.");
      return;
    }
    const editId = vaultEditId?.value?.trim() || "";
    try {
      if (editId) {
        const r = await window.nebula?.vaultUpdate?.({
          id: editId,
          patch: {
            url,
            title: vaultFieldTitle?.value ?? "",
            username,
            password,
            notes: vaultFieldNotes?.value ?? "",
          },
        });
        if (r?.locked) {
          await loadVaultEntriesFromMain();
          if (vaultHintEncryption) {
            vaultHintEncryption.textContent = "Unlock the vault to edit saved passwords.";
          }
          return;
        }
        if (r && !r.ok) return;
      } else {
        await window.nebula?.vaultAdd?.({
          url,
          title: vaultFieldTitle?.value ?? "",
          username,
          password,
          notes: vaultFieldNotes?.value ?? "",
        });
      }
      if (vaultFormWrap) vaultFormWrap.hidden = true;
      resetVaultForm();
      await loadVaultEntriesFromMain();
    } catch {
      /* ignore */
    }
  });
  settingsOpenVault?.addEventListener("click", () => void openVaultPanel());

  vaultUnlockSubmit?.addEventListener("click", () => void submitVaultUnlock());
  vaultUnlockPass?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void submitVaultUnlock();
    }
  });
  vaultLockBtn?.addEventListener("click", async () => {
    await window.nebula?.accountLock?.();
    await loadVaultEntriesFromMain();
  });

  nebulaAccountCreateBtn?.addEventListener("click", async () => {
    const a = nebulaAccountNewPass?.value ?? "";
    const b = nebulaAccountConfirmPass?.value ?? "";
    setNebulaAccountSettingsMessage("");
    if (a !== b) {
      setNebulaAccountSettingsMessage("Passwords do not match.");
      return;
    }
    try {
      const r = await window.nebula?.accountCreate?.({ password: a });
      if (r?.ok) {
        if (nebulaAccountNewPass) nebulaAccountNewPass.value = "";
        if (nebulaAccountConfirmPass) nebulaAccountConfirmPass.value = "";
        setNebulaAccountSettingsMessage(
          "Local Nebula account created. Saved passwords stay locked until you unlock (about 15 minutes per unlock)."
        );
        await refreshNebulaAccountSettingsUI();
        return;
      }
      if (r?.error === "weak") {
        const st = await window.nebula?.accountStatus?.();
        const n = st?.minPasswordLength ?? 8;
        setNebulaAccountSettingsMessage(`Use at least ${n} characters.`);
        return;
      }
      setNebulaAccountSettingsMessage("Could not create account.");
    } catch {
      setNebulaAccountSettingsMessage("Could not create account.");
    }
  });

  nebulaAccountChangeBtn?.addEventListener("click", async () => {
    const cur = nebulaAccountCurrentPass?.value ?? "";
    const next = nebulaAccountChangeNewPass?.value ?? "";
    setNebulaAccountSettingsMessage("");
    try {
      const r = await window.nebula?.accountChange?.({ currentPassword: cur, newPassword: next });
      if (r?.ok) {
        if (nebulaAccountCurrentPass) nebulaAccountCurrentPass.value = "";
        if (nebulaAccountChangeNewPass) nebulaAccountChangeNewPass.value = "";
        setNebulaAccountSettingsMessage("Password updated.");
        return;
      }
      if (r?.error === "bad_password") {
        setNebulaAccountSettingsMessage("Current password is wrong.");
        return;
      }
      if (r?.error === "weak") {
        const st = await window.nebula?.accountStatus?.();
        const n = st?.minPasswordLength ?? 8;
        setNebulaAccountSettingsMessage(`New password must be at least ${n} characters.`);
        return;
      }
      setNebulaAccountSettingsMessage("Could not change password.");
    } catch {
      setNebulaAccountSettingsMessage("Could not change password.");
    }
  });

  nebulaAccountRemoveBtn?.addEventListener("click", async () => {
    setNebulaAccountSettingsMessage("");
    const pwd = nebulaAccountCurrentPass?.value ?? "";
    if (!pwd) {
      setNebulaAccountSettingsMessage("Enter your current password to remove the account.");
      return;
    }
    if (
      !confirm(
        "Remove your local Nebula account? You will no longer need this password to view saved passwords (the vault file is unchanged)."
      )
    ) {
      return;
    }
    try {
      const r = await window.nebula?.accountRemove?.({ password: pwd });
      if (r?.ok) {
        if (nebulaAccountCurrentPass) nebulaAccountCurrentPass.value = "";
        if (nebulaAccountChangeNewPass) nebulaAccountChangeNewPass.value = "";
        setNebulaAccountSettingsMessage("Local Nebula account removed.");
        await refreshNebulaAccountSettingsUI();
        if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
        return;
      }
      if (r?.error === "bad_password") {
        setNebulaAccountSettingsMessage("Wrong password.");
        return;
      }
      setNebulaAccountSettingsMessage("Could not remove account.");
    } catch {
      setNebulaAccountSettingsMessage("Could not remove account.");
    }
  });

  nebulaAccountLockNowBtn?.addEventListener("click", async () => {
    setNebulaAccountSettingsMessage("");
    try {
      await window.nebula?.accountLock?.();
      setNebulaAccountSettingsMessage("Vault locked.");
      if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
    } catch {
      setNebulaAccountSettingsMessage("Could not lock.");
    }
  });

  if (window.nebula?.onPermissionRequest) {
    window.nebula.onPermissionRequest((payload) => openPermissionPromptPanel(payload));
  }

  historyPanelClose?.addEventListener("click", () => closeHistoryPanel());
  historyPanelBackdrop?.addEventListener("click", () => closeHistoryPanel());
  sitePermClose?.addEventListener("click", () => closeSitePermissionsPanel());
  sitePermBackdrop?.addEventListener("click", () => closeSitePermissionsPanel());
  btnSitePerm?.addEventListener("click", () => toggleSitePermissionsPanel());
  document.getElementById("site-perm-global-3p")?.addEventListener("change", () => void onSitePermGlobalChange());
  sitePermPanel?.addEventListener("change", (e) => {
    void onSitePermDefaultChange(e);
    void onSitePermSelectChange(e);
  });

  historyClearBtn?.addEventListener("click", () => {
    if (!confirm("Clear all history for this browsing profile?")) return;
    localStorage.removeItem(historyStorageKey());
    renderHistoryList();
  });

  urlInput.addEventListener("focus", () => {
    urlInput.select();
    queueMicrotask(() => {
      if (urlInput.value.trim().length > 0) refreshOmniboxSuggestions();
    });
  });

  urlInput.addEventListener("input", () => {
    refreshOmniboxSuggestions();
  });

  urlInput.addEventListener("keydown", (e) => {
    if (!omniboxSuggestions || omniboxSuggestions.hidden || omniboxSuggestionRows.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveOmniboxSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveOmniboxSelection(-1);
    } else if (e.key === "Enter" && omniboxSelectedIndex >= 0) {
      e.preventDefault();
      applyOmniboxSuggestion(omniboxSelectedIndex);
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (translatePanel && !translatePanel.hidden) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeTranslatePanel();
          return;
        }
      }
      if (aiDrawer && !aiDrawer.hidden) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeAiDrawer();
          return;
        }
      }
      if (!e.repeat && (e.key === "n" || e.key === "N") && e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) {
        e.preventDefault();
        createTab(homeUrl(), { private: true });
        return;
      }
      if (!e.repeat && printShortcutMatch(e)) {
        if (!shouldSuppressShellPrintShortcut()) {
          e.preventDefault();
          void printActivePage();
        }
        return;
      }
      if (settingsShortcutMatch(e)) {
        e.preventDefault();
        toggleSettingsPanel();
        return;
      }
      if (e.key === "Escape" && tabGroupRenamePanel && !tabGroupRenamePanel.hidden) {
        e.preventDefault();
        closeTabGroupRenameDialog();
        return;
      }
      if (e.key === "Escape" && tabCtxMenu && !tabCtxMenu.hidden) {
        e.preventDefault();
        hideTabContextMenu();
        return;
      }
      if (e.key === "Escape" && sessionRestorePanel && !sessionRestorePanel.hidden) {
        e.preventDefault();
        closeSessionRestorePanel();
        finishStartupWithFreshHome();
        return;
      }
      if (e.key === "Escape" && passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) {
        e.preventDefault();
        closePasswordSaveOfferPanel();
        return;
      }
      if (e.key === "Escape" && permissionPromptPanel && !permissionPromptPanel.hidden) {
        e.preventDefault();
        rejectActivePermissionIfAny();
        return;
      }
      if (e.key === "Escape" && vaultPanel && !vaultPanel.hidden) {
        e.preventDefault();
        if (vaultFormWrap && !vaultFormWrap.hidden) {
          vaultFormWrap.hidden = true;
          resetVaultForm();
          return;
        }
        closeVaultPanel();
        return;
      }
      if (e.key === "Escape" && changelogPanel && !changelogPanel.hidden) {
        e.preventDefault();
        closeChangelogPanel();
        return;
      }
      if (e.key === "Escape" && settingsPanel && !settingsPanel.hidden) {
        e.preventDefault();
        closeSettingsPanel();
        return;
      }
      if (e.key === "Escape" && sitePermPanel && !sitePermPanel.hidden) {
        e.preventDefault();
        closeSitePermissionsPanel();
        return;
      }
      if (e.key === "Escape" && omniboxSuggestions && !omniboxSuggestions.hidden) {
        e.preventDefault();
        hideOmniboxSuggestions();
        return;
      }
      if (historyShortcutMatch(e)) {
        e.preventDefault();
        toggleHistoryPanel();
        return;
      }
      if (e.key === "Escape" && historyPanel && !historyPanel.hidden) {
        e.preventDefault();
        closeHistoryPanel();
        return;
      }
      if (e.key === "Escape" && !findBar.hidden) {
        e.preventDefault();
        closeFindBar();
      }
    },
    true
  );

  findInput.addEventListener("input", () => {
    if (findDebounceTimer) clearTimeout(findDebounceTimer);
    findDebounceTimer = setTimeout(() => {
      findDebounceTimer = null;
      runFind(findInput.value);
    }, 100);
  });

  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) findPrevMatch();
      else findNextMatch();
    }
  });

  findPrevBtn.addEventListener("click", () => findPrevMatch());
  findNextBtn.addEventListener("click", () => findNextMatch());
  findCloseBtn.addEventListener("click", () => closeFindBar());

  if (window.nebula?.onDownload) {
    window.nebula.onDownload(handleDownloadPayload);
  }

  if (updateBannerDismiss) {
    updateBannerDismiss.addEventListener("click", () => {
      if (pendingUpdateVersion) sessionStorage.setItem(UPDATE_DISMISS_KEY, pendingUpdateVersion);
      hideUpdateBanner();
    });
  }
  if (settingsCheckUpdates) {
    settingsCheckUpdates.addEventListener("click", () => void runUpdateCheck(true));
  }
  if (settingsOpenEvsDocs) {
    settingsOpenEvsDocs.addEventListener("click", (e) => {
      e.preventDefault();
      const u = "https://github.com/castlabs/electron-releases/wiki/EVS";
      if (window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(u);
    });
  }

  if (window.nebula?.onTabMediaState) {
    window.nebula.onTabMediaState((payload) => {
      if (!payload || typeof payload !== "object") return;
      const wid = payload.guestWebContentsId;
      const tab = tabForGuestWc(wid);
      if (!tab) return;
      if (typeof payload.audible === "boolean") tab.mediaState.audible = payload.audible;
      if (typeof payload.audioMuted === "boolean") tab.mediaState.audioMuted = payload.audioMuted;
      renderTabMediaIndicators(tab);
    });
  }
  if (window.nebula?.onTabCaptureState) {
    window.nebula.onTabCaptureState((payload) => {
      if (!payload || typeof payload !== "object") return;
      const wid = payload.guestWebContentsId;
      const tab = tabForGuestWc(wid);
      if (!tab) return;
      if (typeof payload.camera === "boolean") tab.mediaState.camera = payload.camera;
      if (typeof payload.microphone === "boolean") tab.mediaState.microphone = payload.microphone;
      renderTabMediaIndicators(tab);
    });
  }

  if (window.nebula?.onAction) {
    window.nebula.onAction(handleAction);
  }

  if (window.nebula?.onContextAction) {
    window.nebula.onContextAction((payload) => {
      if (!payload || typeof payload !== "object") return;
      if (payload.type === "new-tab" && typeof payload.url === "string") {
        const u = payload.url.trim();
        if (!u) return;
        try {
          const parsed = new URL(u);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            createTab(u);
          }
        } catch {
          /* ignore */
        }
        return;
      }
      if (payload.type === "read-aloud" && typeof payload.text === "string") {
        speakPlainTextAloud(payload.text);
      }
    });
  }

  if (window.nebula?.onOpenUrlInTab) {
    window.nebula.onOpenUrlInTab((payload) => {
      const u = typeof payload?.url === "string" ? payload.url.trim() : "";
      if (!u) return;
      const part = typeof payload?.partition === "string" ? payload.partition.trim() : "";
      createTab(u, part ? { partition: part } : {});
    });
  }

  if (window.nebula?.onRefocusActiveWebview) {
    window.nebula.onRefocusActiveWebview(() => {
      scheduleRestoreGuestFocus();
    });
  }

  window.addEventListener("focus", () => {
    scheduleRestoreGuestFocus();
  });

  (function patchBlockingDialogsForGuestFocus() {
    try {
      const nativeAlert = window.alert.bind(window);
      const nativeConfirm = window.confirm.bind(window);
      const nativePrompt = window.prompt.bind(window);

      function guestWebContentsIdForSyncDialog() {
        const w = getActiveWebview();
        if (!w || typeof w.getWebContentsId !== "function") return 0;
        try {
          return w.getWebContentsId();
        } catch {
          return 0;
        }
      }

      window.alert = function nebulaAlert(message) {
        if (typeof window.nebula?.syncDialog === "function") {
          window.nebula.syncDialog({
            kind: "alert",
            message: String(message ?? ""),
            guestWebContentsId: guestWebContentsIdForSyncDialog(),
          });
          return;
        }
        try {
          return nativeAlert(message);
        } finally {
          scheduleRestoreGuestFocus();
        }
      };

      window.confirm = function nebulaConfirm(message) {
        if (typeof window.nebula?.syncDialog === "function") {
          return !!window.nebula.syncDialog({
            kind: "confirm",
            message: String(message ?? ""),
            guestWebContentsId: guestWebContentsIdForSyncDialog(),
          });
        }
        try {
          return nativeConfirm(message);
        } finally {
          scheduleRestoreGuestFocus();
        }
      };

      window.prompt = function nebulaPrompt(message, defaultText) {
        try {
          return nativePrompt(message, defaultText);
        } finally {
          scheduleRestoreGuestFocus();
        }
      };
    } catch {
      /* */
    }
  })();

  wireSplitDropZones();
  wireSplitResizer();
  wireTabStripReorderAndContext();
  wireTabGroupRenamePanel();
  window.addEventListener("beforeunload", () => {
    saveSessionSnapshot();
  });

  syncYoutubeAdSkipAdblockState();
  applyShellAppearance();
  syncChromeLayoutFromSettings();
  async function applyFirstRunSettingsPatch(patch) {
    if (!window.nebula?.setSettings) return;
    try {
      const next = await window.nebula.setSettings(patch);
      if (next && typeof next === "object") appSettings = normalizeAppSettings(next);
      applyShellAppearance();
      syncChromeLayoutFromSettings();
    } catch {
      /* */
    }
  }

  async function runFirstRunOnboardingFlow() {
    if (!firstRunPanel || appSettings.firstRunOnboardingDone !== false) return;

    let shellTheme = appSettings.shellTheme || "dark";
    const showStep = (n) => {
      if (firstRunStepLabel) firstRunStepLabel.textContent = `Step ${n} of 3`;
      if (firstRunStep1) firstRunStep1.hidden = n !== 1;
      if (firstRunStep2) firstRunStep2.hidden = n !== 2;
      if (firstRunStep3) firstRunStep3.hidden = n !== 3;
      if (firstRunMsg) {
        firstRunMsg.textContent = "";
        firstRunMsg.hidden = true;
      }
    };
    const closePanel = () => {
      firstRunPanel.hidden = true;
      firstRunPanel.setAttribute("aria-hidden", "true");
    };
    const openPanel = () => {
      firstRunPanel.hidden = false;
      firstRunPanel.setAttribute("aria-hidden", "false");
    };

    const waitFirstRunChoice = (targets) => {
      return new Promise((resolve) => {
        const cleanups = [];
        const done = (value) => {
          for (const c of cleanups) {
            try {
              c();
            } catch {
              /* */
            }
          }
          resolve(value);
        };
        let armed = 0;
        for (const { el, value } of targets) {
          if (!el) continue;
          armed++;
          const fn = () => done(value);
          el.addEventListener("click", fn);
          cleanups.push(() => el.removeEventListener("click", fn));
        }
        if (armed === 0) done(undefined);
      });
    };

    openPanel();

    while (appSettings.firstRunOnboardingDone === false) {
      showStep(1);
      for (const el of document.querySelectorAll('input[name="first-run-theme"]')) {
        if (el instanceof HTMLInputElement) el.checked = el.value === shellTheme;
      }
      const s1 = await waitFirstRunChoice([
        { el: firstRunStep1Next, value: "next" },
        { el: firstRunSkipAll, value: "skip" },
        { el: firstRunBackdrop, value: "skip" },
      ]);
      if (s1 === "skip" || s1 === undefined) {
        await applyFirstRunSettingsPatch({ shellTheme, firstRunOnboardingDone: true });
        closePanel();
        return;
      }
      const picked = document.querySelector('input[name="first-run-theme"]:checked');
      shellTheme =
        picked && picked instanceof HTMLInputElement && typeof picked.value === "string" ? picked.value : "dark";
      await applyFirstRunSettingsPatch({ shellTheme });

      showStep(2);
      const tryImport = async (src) => {
        const read = await readBookmarkListForImportSource(src);
        if (read.canceled) return;
        if (!read.ok || !read.list) {
          if (firstRunMsg) {
            firstRunMsg.textContent = read.error || "Could not import.";
            firstRunMsg.hidden = false;
          }
          return;
        }
        if (read.list.length === 0) {
          if (firstRunMsg) {
            firstRunMsg.textContent = "No bookmarks found for that browser.";
            firstRunMsg.hidden = false;
          }
          return;
        }
        const { added, skipped } = mergeImportedBookmarks(read.list);
        saveBookmarksToStorage();
        renderBookmarksBar();
        updateBookmarkStar();
        if (firstRunMsg) {
          firstRunMsg.textContent = `Imported ${added} bookmark(s). Skipped ${skipped} duplicate(s).`;
          firstRunMsg.hidden = false;
        }
      };
      const onImpChrome = () => void tryImport("chrome");
      const onImpEdge = () => void tryImport("edge");
      const onImpFx = () => void tryImport("firefox");
      firstRunImportChrome?.addEventListener("click", onImpChrome);
      firstRunImportEdge?.addEventListener("click", onImpEdge);
      firstRunImportFirefox?.addEventListener("click", onImpFx);
      const s2 = await waitFirstRunChoice([
        { el: firstRunStep2Next, value: "next" },
        { el: firstRunStep2Skip, value: "next" },
        { el: firstRunStep2Back, value: "back" },
      ]);
      firstRunImportChrome?.removeEventListener("click", onImpChrome);
      firstRunImportEdge?.removeEventListener("click", onImpEdge);
      firstRunImportFirefox?.removeEventListener("click", onImpFx);
      if (s2 === "back" || s2 === undefined) continue;

      showStep(3);
      const st = (await window.nebula?.accountStatus?.()) || {};
      const hasAcct = !!st.hasAccount;
      const minLen = typeof st.minPasswordLength === "number" ? st.minPasswordLength : 8;
      if (firstRunAccountForm) firstRunAccountForm.hidden = hasAcct;
      if (firstRunAccountSkipHint) firstRunAccountSkipHint.hidden = !hasAcct;
      if (firstRunAccountPass) firstRunAccountPass.value = "";
      if (firstRunAccountPass2) firstRunAccountPass2.value = "";

      const finish = async () => {
        await applyFirstRunSettingsPatch({ shellTheme, firstRunOnboardingDone: true });
        closePanel();
      };

      const s3 = await new Promise((resolve) => {
        const cleanups = [];
        const arm = (el, fn) => {
          if (!el) return;
          const wrap = () => fn();
          el.addEventListener("click", wrap);
          cleanups.push(() => el.removeEventListener("click", wrap));
        };
        arm(firstRunStep3Back, () => {
          for (const c of cleanups) c();
          resolve("back");
        });
        arm(firstRunStep3Skip, () => {
          for (const c of cleanups) c();
          void finish().then(() => resolve("done"));
        });
        arm(firstRunStep3Next, () => {
          for (const c of cleanups) c();
          void finish().then(() => resolve("done"));
        });
        if (!hasAcct && firstRunAccountCreate) {
          const onCreate = async () => {
            const a = firstRunAccountPass?.value || "";
            const b = firstRunAccountPass2?.value || "";
            if (a.length < minLen) {
              if (firstRunMsg) {
                firstRunMsg.textContent = `Password must be at least ${minLen} characters.`;
                firstRunMsg.hidden = false;
              }
              return;
            }
            if (a !== b) {
              if (firstRunMsg) {
                firstRunMsg.textContent = "Passwords do not match.";
                firstRunMsg.hidden = false;
              }
              return;
            }
            const r = await window.nebula?.accountCreate?.({ password: a });
            if (!r?.ok) {
              if (firstRunMsg) {
                firstRunMsg.textContent =
                  r?.error === "exists" ? "Account already exists." : "Could not create account.";
                firstRunMsg.hidden = false;
              }
              return;
            }
            for (const c of cleanups) c();
            void finish().then(() => resolve("done"));
          };
          firstRunAccountCreate.addEventListener("click", onCreate);
          cleanups.push(() => firstRunAccountCreate.removeEventListener("click", onCreate));
        }
      });

      if (s3 === "back" || s3 === undefined) continue;
      return;
    }
  }

  void loadAppSettings().then(async () => {
    bookmarks = loadBookmarksFromStorage();
    renderBookmarksBar();
    if (appSettings.firstRunOnboardingDone === false) {
      await runFirstRunOnboardingFlow();
    }
    tryOfferSessionRestoreOnLaunch();
    setNavButtons();
    updateLoadingUI();
  });

  setTimeout(() => void runUpdateCheck(false), 2800);
})();
