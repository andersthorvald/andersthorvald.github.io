var I18N = {
  data: {
    zh: {
      nav_home: "首页",
      nav_articles: "文档",
      nav_about: "关于",
      articles_title: "快速导航",
      articles_category: "分类",
      articles_tags: "标签",
      articles_date: "发布日期",
      articles_back: "返回首页",
      footer_updated: "最后更新",
      footer_contact: "联系方式",
      stats_runbooks: "运维手册",
      stats_sops: "标准操作",
      stats_refs: "快速参考",
      hero_title: "SRE Wiki",
      hero_subtitle: "站可靠性工程文档中心",
      feat_runbook_title: "运维手册",
      feat_runbook_desc: "标准化的故障排查手册，含诊断步骤",
      feat_sop_title: "标准操作",
      feat_sop_desc: "标准操作流程，保证一致性和安全性",
      feat_ref_title: "快速参考",
      feat_ref_desc: "常用命令和配置速查表",
    },
    en: {
      nav_home: "Home",
      nav_articles: "Docs",
      nav_about: "About",
      articles_title: "Quick Navigation",
      articles_category: "Category",
      articles_tags: "Tags",
      articles_date: "Published",
      articles_back: "Back to Home",
      footer_updated: "Last updated",
      footer_contact: "Contact",
      stats_runbooks: "Runbooks",
      stats_sops: "SOPs",
      stats_refs: "References",
      hero_title: "SRE Wiki",
      hero_subtitle: "Site Reliability Engineering Documentation Center",
      feat_runbook_title: "Runbook",
      feat_runbook_desc: "Standardized troubleshooting manuals with diagnostic steps",
      feat_sop_title: "SOP",
      feat_sop_desc: "Standard operating procedures for consistency and safety",
      feat_ref_title: "Reference",
      feat_ref_desc: "Common commands and configuration quick reference",
    },
    ja: {
      nav_home: "ホーム",
      nav_articles: "ドキュメント",
      nav_about: "概要",
      articles_title: "クイックナビゲーション",
      articles_category: "カテゴリー",
      articles_tags: "タグ",
      articles_date: "公開日",
      articles_back: "ホームに戻る",
      footer_updated: "最終更新",
      footer_contact: "連絡先",
      stats_runbooks: "ランブック",
      stats_sops: "標準操作",
      stats_refs: "リファレンス",
      hero_title: "SRE Wiki",
      hero_subtitle: "サイト信頼性エンジニアリングドキュメントセンター",
      feat_runbook_title: "ランブック",
      feat_runbook_desc: "診断手順を含む標準化されたトラブルシューティングマニュアル",
      feat_sop_title: "標準操作",
      feat_sop_desc: "一貫性と安全性を確保するための標準操作手順",
      feat_ref_title: "リファレンス",
      feat_ref_desc: "一般的なコマンドと構成のクイックリファレンス",
    },
    "zh-TW": {
      nav_home: "首頁",
      nav_articles: "文檔",
      nav_about: "關於",
      articles_title: "快速導航",
      articles_category: "分類",
      articles_tags: "標籤",
      articles_date: "發布日期",
      articles_back: "返回首頁",
      footer_updated: "最後更新",
      footer_contact: "聯絡方式",
      stats_runbooks: "運維手冊",
      stats_sops: "標準操作",
      stats_refs: "快速參考",
      hero_title: "SRE Wiki",
      hero_subtitle: "站可靠性工程文檔中心",
      feat_runbook_title: "運維手冊",
      feat_runbook_desc: "標準化的故障排查手冊，含診斷步驟",
      feat_sop_title: "標準操作",
      feat_sop_desc: "標準操作流程，保證一致性和安全性",
      feat_ref_title: "快速參考",
      feat_ref_desc: "常用命令和配置速查表",
    }
  },
  current: "zh",
  init: function() {
    var saved = localStorage.getItem("sre-wiki-lang");
    if (saved && this.data[saved]) this.current = saved;
    this.apply();
  },
  switchTo: function(lang) {
    if (this.data[lang]) {
      this.current = lang;
      localStorage.setItem("sre-wiki-lang", lang);
      this.apply();
    }
  },
  t: function(key) {
    return (this.data[this.current] && this.data[this.current][key]) ? this.data[this.current][key] : (this.data.zh[key] || key);
  },
  apply: function() {
    var self = this;
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = self.t(key);
    });
    // Update lang attribute
    document.documentElement.lang = this.current;
    // Update toggle button text
    var btn = document.querySelector(".lang-toggle");
    if (btn) btn.textContent = this.current.toUpperCase();
  }
};
document.addEventListener("DOMContentLoaded", function() { I18N.init(); });