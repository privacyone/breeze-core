#ifndef CHROME_BROWSER_UI_PMC_CONTAINER_PMC_CONTAINER_H_
#define CHROME_BROWSER_UI_PMC_CONTAINER_PMC_CONTAINER_H_

#include <map>
#include <memory>
#include <string>

#include "base/scoped_observation.h"
#include "chrome/browser/extensions/api/extension_action/extension_action_api.h"
#include "chrome/browser/ui/browser.h"
#include "chrome/browser/ui/extensions/extensions_container.h"
#include "chrome/browser/ui/toolbar/toolbar_action_view_controller.h"
#include "chrome/browser/ui/views/toolbar/toolbar_action_view.h"
#include "components/prefs/pref_member.h"
#include "extensions/browser/extension_registry.h"
#include "extensions/browser/extension_registry_observer.h"
#include "extensions/common/extension.h"
#include "ui/views/controls/separator.h"
#include "ui/gfx/skia_util.h"
#include "ui/views/view.h"

class ExtensionActionViewController;

namespace extensions {
class ExtensionActionManager;
}

namespace views {
class Button;
}

class PMCContainer : public views::View,
                     public ExtensionsContainer,
                     public extensions::ExtensionActionAPI::Observer,
                     public extensions::ExtensionRegistryObserver,
                     public ToolbarActionView::Delegate {
 public:
  PMCContainer(Browser* browser, Profile* profile);
  ~PMCContainer() override;

  void Init();
  void Update();
  void SetShouldHide(bool should_hide);

  // ToolbarActionView::Delegate
  content::WebContents* GetCurrentWebContents() override;
  // Returns the view of the toolbar actions overflow menu to use as a
  // reference point for a popup when this view isn't visible.
  views::LabelButton* GetOverflowReferenceView() const override;
  // Returns the preferred size of the ToolbarActionView.
  gfx::Size GetToolbarActionSize() override;
  // Overridden from views::DragController (required by
  // ToolbarActionView::Delegate):
  void WriteDragDataForView(View* sender,
                            const gfx::Point& press_pt,
                            ui::OSExchangeData* data) override;
  int GetDragOperationsForView(View* sender, const gfx::Point& p) override;
  bool CanStartDragForView(View* sender,
                           const gfx::Point& press_pt,
                           const gfx::Point& p) override;

  // ExtensionRegistryObserver:
  void OnExtensionLoaded(content::BrowserContext* browser_context,
                         const extensions::Extension* extension) override;
  void OnExtensionUnloaded(content::BrowserContext* browser_context,
                           const extensions::Extension* extension,
                           extensions::UnloadedExtensionReason reason) override;

  // ExtensionActionAPI::Observer
  // Called when there is a change to the given |extension_action|.
  // |web_contents| is the web contents that was affected, and
  // |browser_context| is the associated BrowserContext. (The latter is
  // included because ExtensionActionAPI is shared between normal and
  // incognito contexts, so |browser_context| may not equal
  // |browser_context_|.)
  void OnExtensionActionUpdated(
      extensions::ExtensionAction* extension_action,
      content::WebContents* web_contents,
      content::BrowserContext* browser_context) override;

  // views::View:
  void ChildPreferredSizeChanged(views::View* child) override;

 private:
  // Special positions in the container designators
  enum ActionPosition : int {
    ACTION_ANY_POSITION = -1,
  };

  // Action info container
  struct ActionInfo {
    ActionInfo();
    ~ActionInfo();
    // Reset view and view controller
    void Reset();

    int position_;
    std::unique_ptr<ToolbarActionView> view_;
    std::unique_ptr<ExtensionActionViewController> view_controller_;
  };

  // Actions that belong to the container
  std::map<std::string, ActionInfo> actions_;

  // ExtensionsContainer:
  ToolbarActionViewController* GetActionForId(
      const std::string& action_id) override;
  ToolbarActionViewController* GetPoppedOutAction() const override;
  void OnContextMenuShown(ToolbarActionViewController* extension) override;
  void OnContextMenuClosed(ToolbarActionViewController* extension) override;
  bool IsActionVisibleOnToolbar(
      const ToolbarActionViewController* action) const override;
  extensions::ExtensionContextMenuModel::ButtonVisibility GetActionVisibility(
      const ToolbarActionViewController* action) const override;
  void UndoPopOut() override;
  void SetPopupOwner(ToolbarActionViewController* popup_owner) override;
  void HideActivePopup() override;
  bool CloseOverflowMenuIfOpen() override;
  void PopOutAction(ToolbarActionViewController* action,
                    bool is_sticky,
                    base::OnceClosure closure) override;
  bool ShowToolbarActionPopupForAPICall(const std::string& action_id) override;
  void ShowToolbarActionBubble(
      std::unique_ptr<ToolbarActionsBarBubbleDelegate> bubble) override;
  void ShowToolbarActionBubbleAsync(
      std::unique_ptr<ToolbarActionsBarBubbleDelegate> bubble) override;
  void ToggleExtensionsMenu() override;
  bool HasAnyExtensions() const override;

  // Actions operations
  bool ShouldShowAction(const std::string& id) const;
  bool IsContainerAction(const std::string& id) const;
  void AddAction(const extensions::Extension* extension);
  void AddAction(const std::string& id);
  void RemoveAction(const std::string& id);
  void UpdateActionVisibility(const std::string& id);
  views::Button* GetActionButton(const std::string& id) const;
  bool IsActionShown(const std::string& id) const;
  void UpdateActionState(const std::string& id);
  void AttachAction(const std::string& id);

  bool should_hide_ = false;
  ToolbarActionViewController* popup_owner_ = nullptr;
  // The Browser this LocationBarView is in.  Note that at least
  // chromeos::SimpleWebViewDialog uses a LocationBarView outside any browser
  // window, so this may be NULL.
  Browser* const browser_;

  void OnExtensionSystemReady();

  extensions::ExtensionSystem* extension_system_;
  extensions::ExtensionActionAPI* extension_action_api_;
  extensions::ExtensionRegistry* extension_registry_;
  extensions::ExtensionActionManager* extension_action_manager_;

  // Listen to extension load, unloaded notifications.
  base::ScopedObservation<extensions::ExtensionRegistry,
                          extensions::ExtensionRegistryObserver>
      extension_registry_observer_{this};

  // Listen to when the action is updated
  base::ScopedObservation<extensions::ExtensionActionAPI,
                          extensions::ExtensionActionAPI::Observer>
      extension_action_observer_{this};

  views::Separator* vertical_separator_ = nullptr;

  base::WeakPtrFactory<PMCContainer> weak_ptr_factory_;

  DISALLOW_COPY_AND_ASSIGN(PMCContainer);
};

#endif  // CHROME_BROWSER_UI_PMC_CONTAINER_PMC_CONTAINER_H_