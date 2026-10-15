# GitHub 上传与发布说明

这个文件包对应你已经确认没有问题的版本。网页、素材和音乐均已包含，英文内容、场景、点击位置与交互逻辑保持原样。

## 一、先解压

解压 `The_Unheard_Tide_GitHub_Pages.zip`，打开里面的 `The_Unheard_Tide_GitHub` 文件夹。

上传时，将这个文件夹里面的全部内容放到仓库根目录。打开 GitHub 仓库首页时，应能直接看到 `index.html` 和 `assets` 文件夹。

请先解压再上传。把 ZIP 本身放进仓库，只会保存压缩包，不会展开成网页。

## 二、推荐用 GitHub Desktop 一次上传

1. 在 GitHub 新建仓库，例如 `the-unheard-tide`。如果使用免费账户发布 GitHub Pages，选择 **Public**，勾选添加 README，创建仓库。已有可用仓库可以直接使用。
2. 打开并登录 GitHub Desktop，选择 **File → Clone repository**，找到刚创建的仓库，选择电脑上的保存位置，再点击 **Clone**。
3. 打开克隆到电脑的仓库文件夹，将 `The_Unheard_Tide_GitHub` 里面的全部内容复制进去。若提示 README 同名，可用本包中的 README 替换。不要再多套一层文件夹。
4. 返回 GitHub Desktop，在左下角 Summary 输入 `Upload The Unheard Tide`，点击 **Commit to main**，再点击 **Push origin**。如果你的分支名称不同，按钮会显示实际分支名称。
5. 上传后，回到 GitHub 仓库首页，确认根目录有 `index.html`、`style.css`、各个 `.mjs` 文件和完整的 `assets` 文件夹。

这个网页是纯静态文件，不需要安装 Node.js，也不需要运行构建命令。

## 三、也可以用 GitHub 网页分批上传

GitHub 网页每次最多上传 100 个文件，单个文件上限为 25 MiB。本包的每个文件均低于这个上限，但 `assets` 素材数量较多，需要分批上传。

1. 先在仓库根目录用 **Add file → Upload files** 上传 `index.html`、`style.css`、全部 `.mjs` 文件和两份说明文件，提交保存。
2. 用 **Add file → Create new file**，将文件名输入为 `assets/README.txt`，正文填写 `Website assets`，提交保存。这样会建立 `assets` 文件夹。
3. 在 GitHub 打开这个 `assets` 文件夹，再选择 **Add file → Upload files**。
4. 打开电脑上本包的 `assets` 文件夹，每次选择不超过 100 个素材文件，拖入上传区域并提交保存。重复，直至这个文件夹内的所有素材全部上传。本包原有 `assets` 中有 260 个文件。
5. 这些素材应直接出现在 GitHub 的 `assets` 目录内，不要形成 `assets/assets`。文件名和大小写保持不变。

## 四、开启 GitHub Pages

1. 进入仓库 **Settings**。
2. 左侧选择 **Pages**。
3. 在 **Build and deployment** 中，将 **Source** 设置为 **Deploy from a branch**。
4. 将 **Branch** 设置为 **main**，旁边的目录选择 **/(root)**，点击 **Save**。如果仓库的分支名称不同，请选择实际上传文件的分支。
5. 等待 GitHub 显示部署成功，再打开 Pages 页面给出的网址。一般格式为 `https://你的用户名.github.io/仓库名/`。

## 五、打开后检查

- 首页进入、五个场景切换正常。
- 每个物品的小标记都能点击，原位置出现几何卡片。
- 再次点击几何卡片，会放大显示；鼠标拖动能转动，滚轮能缩放，英文文字完整显示。
- 第 02、03 个画面属于同一座岛，第 04、05 个画面属于另一座岛。
- 背景音乐保持网页设定的 100%，转场没有额外音效，点击声为低沉的轻触声。

第一次需要点击或按键才能启动声音。如果没有声音，请点击网页的 **Sound on** 按钮，并检查电脑、浏览器标签页的音量和静音状态。

不要直接双击本包的 `index.html` 来判断运行效果：本包面向网站托管，浏览器可能限制本地文件读取模块和 JSON。请在 GitHub Pages 上打开；需要离线双击时，使用之前的独立 HTML 文件。

## 常见问题

**Pages 显示 404**：确认选择了正确的分支和 `/(root)`；仓库根目录中必须直接有 `index.html`。

**图片、视频或旋转几何缺失**：确认 `assets` 文件夹完整上传，文件名没有修改，没有多套目录。

**网页上传提示数量超限**：用 GitHub Desktop 上传，或按每次最多 100 个文件分批上传。

**修改后仍看到旧版**：等待新部署完成，在浏览器按 `Ctrl + F5` 刷新。

## 官方帮助

- [GitHub Pages 发布设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub 文件上传限制](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [GitHub Desktop 克隆仓库](https://docs.github.com/en/desktop/adding-and-cloning-repositories/cloning-and-forking-repositories-from-github-desktop)
