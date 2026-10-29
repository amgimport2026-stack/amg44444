# AMG Juguetes · catálogo mayorista

初版静态网站已经完成，包含：

- Google Sheets 实时商品读取与 `Activo / Inactivo` 过滤
- 西语首页、分类筛选、名称/SKU 搜索、价格排序
- LocalStorage 持久化购物车、数量修改、删除与清空
- 结算表单、必填校验、整单明细汇总
- FormSubmit 邮件下单，默认收件地址为 `1813638105@qq.com`
- WhatsApp 下单入口，可在 `config.js` 填入号码后启用
- 主图失败时自动尝试备用图，再失败时显示本地 SVG 占位图
- 表格不可用或为空时自动显示 12 条示例商品

## 本地预览

直接双击 `index.html` 也能浏览，但为了完整测试 Google Sheets 读取，建议在本目录运行：

```powershell
node scripts/serve.js
```

然后访问 `http://127.0.0.1:4173`。

## 当前表格状态

浏览器渲染测试已经读到当前表格中的 2 条商品：

- `CALCULADORA BLK2218`
- `CALCULADORA CT818`

表格字段映射已经验证可用。正式部署前，请确认 Google Sheets 的共享设置为：

`共享 → 常规访问权限 → 任何拥有链接的人 → 查看者`

如果仍是“受限”，外部网站无法稳定读取商品数据，网页会改用示例商品。

## 日常维护

商品字段支持以下表头：

| Campo | 必需 | 说明 |
| --- | --- | --- |
| Categoría | 建议 | 商品分类，例如 `Pelotas` |
| Nombre | 是 | 西语商品名称 |
| SKU | 建议 | 唯一货号，购物车以 SKU 识别商品 |
| Precio | 是 | 数字批发价，不要混用多种货币 |
| Estado | 是 | `Activo` 上架，`Inactivo` 自动隐藏 |
| URL Imagen Principal | 否 | 主图 HTTPS 直链 |
| URL Imagen Respaldo | 否 | 主图失败后自动加载 |
| Descripción | 否 | 简短商品说明 |

保存表格后刷新网站即可更新商品，不需要重新部署。

当前表格还包含 `PAQUETE`、`PAQUETE Precio`、`BULTO`、`BULTO Precio` 四列；网站会在商品卡中展示包装价和整箱价。购物车暂按 `UNIDAD Precio`（单件价）计算，批量采购可在订单备注中注明，销售团队确认最终整单价格。

## 配置收件邮箱和 WhatsApp

打开 `config.js`：

```js
window.AMG_CONFIG = {
  orderEmail: "1813638105@qq.com",
  whatsappNumber: "584121234567",
  currency: "CNY",
  // ...
};
```

WhatsApp 号码使用国家区号，只写数字，不加 `+`、空格或短横线。

当前表格价格使用人民币符号 `￥`，因此站点统一按 `CNY` 显示。如果后续改用美元或其他币种，请同步修改 `currency`，例如：

```js
currency: "USD"
```

不要只在部分商品价格前手写货币符号，否则网页无法正确计算订单小计。

## 邮件下单需要激活一次

当前默认使用 FormSubmit，不需要服务器或 API 密钥，订单会发往 `orderEmail`：

- 第一次正式提交时，FormSubmit 可能先向 `1813638105@qq.com` 发送激活邮件。
- 打开 QQ 邮箱并点击邮件里的确认链接。
- 回到网站重新提交一次测试订单。
- 如果没收到，请检查 QQ 邮箱的垃圾邮件目录。

站点自动测试没有实际发送测试订单，以避免在你确认收件设置前产生外部邮件。

如需改用 Formspree，在 Formspree 创建表单后，把 endpoint 填进：

```js
formProvider: "formspree",
formEndpoint: "https://formspree.io/f/你的表单ID",
```

## 部署到 Vercel

这是纯静态项目，不需要构建命令：

1. 在 Vercel 新建项目，并导入包含本目录的项目仓库。
2. Framework Preset 选择 `Other`。
3. Build Command 留空。
4. Output Directory 留空或填写 `.`。
5. 部署完成后，用手机和电脑各打开一次，完成邮件、购物车和 WhatsApp 的最终测试。

也可以把整个目录拖入 Vercel 的静态部署入口。`scripts/`、截图和测试文件已通过 `.vercelignore` 排除。

## 部署到帽子云 / 毛子云

如果出现：

```text
ERROR: 未知服务类型：检测到当前应用非 Some[static] 应用
```

说明平台没有在仓库根目录识别到静态入口。帽子云社区给出的判断条件是根目录存在 `index.html` 或 `package.json`。

本项目已经同时提供两者，并加入静态构建命令：

```powershell
npm run build
```

构建结果位于 `build/`。平台日志中显示的默认输出目录也是 `build`，无需额外修改。在帽子云创建项目时优先选择“静态网站”，并确认：

- Git 仓库根目录直接显示 `index.html` 和 `package.json`
- 不是把它们放在 `amg web/`、`website/` 等子目录里
- 若平台要求构建命令，填写 `npm run build`
- 若平台提供“发布目录/输出目录”，填写 `build`
- 分支应为实际包含这些文件的分支，通常是 `main`

如果仓库页面第一层只有一个文件夹，需要把该文件夹里的文件移到仓库根目录后再部署。

## 上线前检查

1. 将 `Google Sheets` 设为“任何拥有链接的人可查看”。
2. 将 `config.js` 中的 WhatsApp 号码补全。
3. 按页面上的实际收件地址完成 FormSubmit 激活。
4. 从表中下架一个测试商品，刷新网页确认它消失。
5. 检查主图与备用图 URL 都是图片直链。
6. 在委内瑞拉网络环境测试加载速度和 WhatsApp 跳转。

## 文件说明

- `index.html`：页面结构
- `styles.css`：响应式界面样式
- `app.js`：表格读取、商品渲染、购物车、表单与图片降级
- `config.js`：邮箱、WhatsApp、表格 ID、币种等可维护配置
- `vercel.json`：Vercel 静态部署与基础安全响应头
