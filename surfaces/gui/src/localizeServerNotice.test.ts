import { afterEach, describe, expect, it } from "vitest";
import i18n from "i18next";
import zh from "./locales/zh.json";
import { localizeServerNotice } from "./localizeServerNotice";

describe("localizeServerNotice mode markers", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("maps Bypass / Ask / Auto-approve mode-on lines into Chinese", async () => {
    i18n.addResourceBundle("zh", "translation", zh, true, true);
    await i18n.changeLanguage("zh");
    expect(localizeServerNotice("Bypass approvals is on.")).toBe("绕过审批已开启。");
    expect(localizeServerNotice("Ask for approval is on.")).toBe("需审批已开启。");
    expect(localizeServerNotice("Auto-approve is on.")).toBe("自动审批已开启。");
    expect(localizeServerNotice("Discuss is on.")).toBe("讨论已开启。");
  });

  it("maps the Auto-approve explainer body", async () => {
    i18n.addResourceBundle("zh", "translation", zh, true, true);
    await i18n.changeLanguage("zh");
    expect(
      localizeServerNotice(
        "Auto-approve uses a model to let routine actions through without asking; anything it isn't sure about still comes to you. It cuts interruptions but still carries some risk i.e. a command it allows still reaches anything you can. These are model judgments, and not guarantees.",
      ),
    ).toContain("自动审批会用模型放行常规操作");
  });

  it("keeps English when the UI language is English", async () => {
    await i18n.changeLanguage("en");
    expect(localizeServerNotice("Bypass approvals is on.")).toBe("Bypass approvals is on.");
  });
});
