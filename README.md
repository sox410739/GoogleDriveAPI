# **Google Drive API**
可以操控 Google 帳戶的雲端硬碟各項操作
# **environment**
安裝此資料夾
```
npm install
```
在 config 中必須包含 google-api-credentials，就是 google 給你的 OAuth 憑證，記得專案要先 enable Google Drive API，enable 完大概等個一分鐘就可以使用了。
```
{
    "google-api-credentials": {
        "client_id": "",
        "project_id": "",
        "auth_uri": "",
        "token_uri": "",
        "auth_provider_x509_cert_url": "",
        "client_secret": "",
        "redirect_uris": [
            "",
            ""
        ]
    } 
}
```
接著引入 GoogleDrive.js 即可
```
const GoogleDrive = require('./GoogleDrive');
```
# **Example**
```
const GoogleDrive = require('./GoogleDrive');
const TOKEN = require('./token.json');

const drive = new GoogleDrive(TOKEN);

// 列出10個雲端硬碟裡的資料夾 
drive.fileFinder({
    mimeType: drive.GOOGLE_MIME_TYPE.FOLDER
}, 10).then( result => {
    console.log(result);
});
```
# **`Class` GoogleDrive**
## **Attributes**
- GOOGLE_MIME_TYPE: 
    - SHEET (google sheet)
    - DOCS (google 文件)
    - FOLDER (資料夾)

## **fileFinder**
依據 [queryOption](#queryOption) 搜尋符合的檔案。
|Argument|type|description|
|--------|----|-----------|
|[queryOption](###queryOption)|Object|尋找的依據，要完全一致不是關鍵字搜尋|
|pageSize|Number|搜尋幾個|

return filter 的陣列，包括每個檔案的 ID 和檔案名稱。
```
[
    {id: "", name: ""},
    {id: "", name: ""},
    ...
]
```

### queryOption
|key|description|
|---|-----------|
|name|檔案名稱|
|mimeType|檔案類型，可使用 mime-types 的 lookup，或是[GOOGLE_MIME_TYPE](#Attributes)

## **fileUpload**
上傳檔案
|Argument|type|description|
|--------|----|-----------|
|file|fileStream|(require)要上傳的檔案|
|fileName|String|(require)上傳後的檔案名稱|
|underFolder|String|此為 folderId，上傳到某資料夾底下，若為 null 代表上傳到根目錄|

return 創建後的 fileId

## **createFolder**
創建資料夾

|Argument|type|description|
|--------|----|-----------|
|fileName|String|(require)創建的資料夾名稱|
|underFolder|String|此為 folderId，創建在某資料下|

return 創建後的 folderId

## **shareTo**
共享檔案或資料夾
|Argument|type|description|
|--------|----|-----------|
|fileId|string||
|email|string|要共享的gmail|

## **unShareTo**
解除共享
|Argument|type|description|
|--------|----|-----------|
|fileId|string||
|email|string|要共享的gmail|

## **getSharedLink**
取得共享連結
|Argument|type|description|
|--------|----|-----------|
|fileId|string||