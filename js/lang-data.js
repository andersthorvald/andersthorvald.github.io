var I18N = {
  data: {
    zh: {
      lang_zh: "中文",
      lang_en: "EN",
      lang_ja: "日",
      lang_tw: "繁",
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
      article_category: "分类",
      article_tags: "标签",
      article_date: "日期",
      article_back: "返回首页",
      nav_home: "首页",
      about_title: "关于我",
      about_subtitle: "了解我更多",
      about_bio: "热爱技术的 SRE 工程师，专注于保障服务稳定性。业余时间喜欢研究新技术、收集手办、刷 B 站。",
      about_motto: "只要不影响到他人，自己爱做什么都好",
      like_text: "点赞",
      db_title: "数据库故障转移手册",
      db_precheck: "预先检查",
      db_precheck_1: "验证应用服务器无法连接主数据库",
      db_precheck_2: "检查监控告警确认数据库健康状态",
      db_step1: "步骤 1：确认主库故障",
      db_step2: "步骤 2：提升从库",
      db_step3: "步骤 3：更新连接字符串",
      db_verify: "验证",
      db_verify_1: "从应用服务器测试连接",
      db_verify_2: "监控剩余从库的复制延迟",
      db_verify_3: "确认只读从库已指向新主库",
      sr_title: "服务重启手册",
      sr_when: "何时使用",
      sr_when_desc: "服务无响应、返回 5xx 错误、或请求挂起时使用此手册。",
      sr_step1: "步骤 1：检查服务状态",
      sr_step2: "步骤 2：检查资源使用",
      sr_step3: "步骤 3：重启服务",
      sr_step4: "步骤 4：验证健康状态",
      sr_step5: "步骤 5：监控 5 分钟",
      sr_step5_desc: "在 Grafana 中观察错误率和延迟。",
      sr_escalation: "升级处理",
      sr_escalation_desc: "如果重启失败或服务反复崩溃，请升级到 #sre-incidents 群组。",
      ir_title: "事件响应标准操作流程",
      ir_severity: "严重等级",
      ir_level: "等级",
      ir_response_time: "响应时间",
      ir_example: "示例",
      ir_p1_time: "15 分钟",
      ir_p1_desc: "完全宕机、数据丢失",
      ir_p2_time: "1 小时",
      ir_p2_desc: "部分服务中断",
      ir_p3_time: "4 小时",
      ir_p3_desc: "性能下降",
      ir_response_steps: "响应步骤",
      ir_step1: "1. 确认事件",
      ir_step1_1: "在 PagerDuty 中认领事件",
      ir_step1_2: "创建事件频道: #inc-YYYYMMDD-描述",
      ir_step2: "2. 评估",
      ir_step2_1: "查看监控仪表盘",
      ir_step2_2: "确定影响范围",
      ir_step2_3: "分配角色: 负责人、沟通者、技术支持",
      ir_step3: "3. 缓解",
      ir_step3_1: "每 15 分钟更新一次状态",
      ir_step3_2: "优先采用最快的缓解方案",
      ir_step3_3: "实时记录操作",
      ir_step4: "4. 解决",
      ir_step4_1: "确认指标恢复正常",
      ir_step4_2: "更新状态页面",
      ir_step4_3: "在 PagerDuty 中关闭事件",
      ir_step5: "5. 后续跟进",
      ir_step5_1: "48 小时内安排复盘会议",
      ir_step5_2: "在 Jira 中创建待办事项",
      ir_step5_3: "如有遗漏则更新运维手册",
      ir_contacts: "联系方式",
      ir_oncall: "值班 SRE: PagerDuty",
      ir_eng_lead: "工程负责人: @eng-lead",
      ir_mgt: "管理层: @mgt-oncall",
      aqr_title: "告警快速参考",
      aqr_p1_header: "高优先级 (P1)",
      aqr_cpu: "CPU > 90% 持续 5 分钟",
      aqr_mem: "内存 > 95% 持续 5 分钟",
      aqr_disk: "磁盘使用 > 90%",
      aqr_p2_header: "中优先级 (P2)",
      aqr_resp_time: "响应时间 > 2 秒",
      aqr_resp_time_1: "检查应用日志中的慢查询",
      aqr_resp_time_2: "检查上游服务健康状态",
      aqr_resp_time_3: "必要时扩容: kubectl scale deployment --replicas=+2",
      aqr_err_rate: "错误率 > 1%",
      aqr_err_rate_1: "检查最近的部署",
      aqr_err_rate_2: "必要时回滚: helm rollback <release>",
      aqr_io_wait: "磁盘 I/O 等待 > 20%",
      aqr_p3_header: "低优先级 (P3)",
      aqr_cert: "证书到期 < 30 天",
      aqr_conn_pool: "连接池使用 > 80%",
      aqr_conn_pool_desc: "检查应用连接池设置，必要时扩容数据库。",
      dd_title: "Docker 调试命令",
      dd_inspect: "容器检查",
      dd_inside: "进入容器内部",
      dd_network: "网络调试",
      dd_perf: "性能",
      dd_cleanup: "清理",
      kpd_title: "K8s Pod 调试手册",
      kpd_quick: "快速检查",
      kpd_restart: "重启问题",
      kpd_resource: "资源问题",
      kpd_network: "网络调试",
      kpd_shell: "进入 Pod Shell",
      kpd_fix: "常见修复",
      // Homepage links
      link_database_failover: "数据库故障转移",
      link_service_restart: "服务重启",
      link_incident_response: "事件响应",
      link_alert_quick_reference: "告警快速参考",
      link_docker_debug: "Docker 调试",
      link_k8s_pod_debug: "K8s Pod 调试",
      // About page
      interest_anime: "🎮 二次元",
      interest_figures: "🎨 手办收藏",
      interest_sre: "💻 SRE",
      interest_hacking: "🔓 黑客技术",
      qr_title: "扫码添加",
      qr_desc: "打开对应APP扫描二维码",
      qr_close: "关闭",
      qr_wechat: "微信扫码添加",
      about_page_title: "关于 - Thorvald",
      social_bilibili: "B站",
      social_youtube: "YouTube",
      social_email: "邮箱",
      social_wechat: "微信",
      social_x: "X",
      social_github: "GitHub"
    },
    en: {
      qr_wechat: "WeChat QR Code",
      about_page_title: "About - Thorvald",
      social_bilibili: "Bilibili",
      social_youtube: "YouTube",
      social_email: "Email",
      social_wechat: "WeChat",
      social_x: "X",
      social_github: "GitHub"
    },
    ja: {
      qr_wechat: "WeChat QRコード",
      about_page_title: "概要 - Thorvald",
      social_bilibili: "B站",
      social_youtube: "YouTube",
      social_email: "メール",
      social_wechat: "WeChat",
      social_x: "X",
      social_github: "GitHub"
    },
    "zh-TW": {
      qr_wechat: "微信掃碼添加",
      about_page_title: "關於 - Thorvald",
      social_bilibili: "B站",
      social_youtube: "YouTube",
      social_email: "郵箱",
      social_wechat: "微信",
      social_x: "X",
      social_github: "GitHub"
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
      document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.classList.remove('active');
      });
      document.querySelector('.lang-btn[onclick*="switchTo(\'' + lang + '\')"]').classList.add('active');
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
    document.querySelectorAll('.lang-btn[data-i18n]').forEach(function(btn) {
      var key = btn.getAttribute("data-i18n");
      btn.textContent = self.t(key);
    });
    document.documentElement.lang = this.current;
  }
};
document.addEventListener("DOMContentLoaded", function() { I18N.init(); });