const googleapis = require('googleapis');
const mime = require('mime-types');

/**
 * control google drive
 */
module.exports = class GoogleDrive {
    #drive;
    /**
     * google 特有的 mime type
     */
    GOOGLE_MIME_TYPE;
    
    /**
     * @param {Object} credentials 專案憑證
     * @param {Object} token drive access_token
     * @param {string} token.access_token
     * @param {string} token.refresh_token
     * @param {string} token.scope
     * @param {string} token.token_type
     * @param {Date} token.expiry_date
     */
    constructor(credentials, token) {
        const { client_id, client_secret, redirect_uris } = credentials;
        const auth = new googleapis.google.auth.OAuth2( client_id, client_secret, redirect_uris[0] );
        auth.setCredentials( {...token} );
        this.#drive = googleapis.google.drive( {
            version: 'v3',
            auth
        });

        this.GOOGLE_MIME_TYPE = {
            FOLDER: 'application/vnd.google-apps.folder',
            DOCS: 'application/vnd.google-apps.document',
            SHEET: 'application/vnd.google-apps.spreadsheet'
        }
    }


    /**
     * @typedef {Object} File
     * @property {String} id 檔案 id
     * @property {String} name
     */

    /**
     * 尋找 drive 中的檔案和資料夾
     * @param {Object} queryOption 
     * @param {String} queryOption.name 檔案名稱
     * @param {String} queryOption.mimeType 檔案類型，可以使用 GOOGLE_MIME_TYPE 或是 mime.lookup
     * @param {String} queryOption.underFolder 搜尋某資料夾下
     * @param {Number} [pageSize] limit
     * @returns {File[]} Array of File contain id, name
     */
    fileFinder(queryOption, pageSize) {
        let query = [];
        if (queryOption.name) query.push(`name = '${queryOption.name}'`);
        if (queryOption.mimeType) query.push(`mimeType = '${queryOption.mimeType}'`);
        if (queryOption.underFolder) query.push(`${queryOption.underFolder} in parents`);
        
        query = query.join(' and ')

        return new Promise( (resolve, reject) => {
            this.#drive.files.list({
                q: query,
                pageSize,
                fields: 'files(id, name)'
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result.data.files);
            });
        })
    }


    /**
     * 上傳檔案
     * @param {*} file 
     * @param {String} fileName 
     * @param {String} [underFolder] 上傳到某資料夾底下，若不給就上傳到根目錄
     */
    async fileUpload(file, fileName, underFolder) {
        let mimeType = mime.lookup(fileName);
        let googleMimeType = await this.#mapGoogleMimeType(mimeType);
        let resource = {
            name: fileName,
            mimeType: googleMimeType,
            parents: underFolder ? [underFolder] : undefined
        }
        let media = {
            mimeType,
            body: file
        }

        return new Promise((resolve, reject) => {
            this.#drive.files.create({
                resource,
                media,
                fields: 'id',
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result.data.id);
            })
        });
    }

    /**
     * 新增資料夾
     * @param {String} folderName 
     * @param {String} [underFolder] 上傳到某資料夾底下，若不給就上傳到根目錄
     */
    createFolder(folderName, underFolder) {
        let resource = {
            name: folderName,
            mimeType: this.GOOGLE_MIME_TYPE.FOLDER,
            parents: underFolder ? [underFolder] : undefined
        }

        return new Promise((resolve, reject) => {
            this.#drive.files.create({
                resource,
                fields: 'id'
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result.data.id);
            })
        });
    }

    /**
     * 共享檔案給某人
     * @param {String} fileId 
     * @param {String} email gmail
     */
    shareTo(fileId, email) {
        let resource = {
            type: 'user',
            role: 'writer',
            emailAddress: email,
        };

        return new Promise((resolve, reject) => {
            this.#drive.permissions.create({
                resource, 
                fileId
            }, (err, result) => {
                if (err) reject(err);
                else resolve();
            });
        })
    }

    /**
     * 解除共享
     * @param {String} fileId 
     * @param {String} email gmail
     */
    async unShareTo(fileId, email) {
        let permissions = await this.#listFilePermissions(fileId);
        let destination = permissions.filter(value => {
            return value.emailAddress === email;
        });
        if (!destination.length) {
            throw new Error('此文件無此共用 email');
        }
        let permissionId = destination[0].id;

        return new Promise((resolve, reject) => {
            this.#drive.permissions.delete({
                fileId, 
                permissionId 
            }, (err, result) => {
                if (err) reject(err);
                else resolve();
            })
        });
    }


    /**
     * 獲得該資料的共享連結
     * @param {String} fileId 
     * @returns {String} url
     */
    getSharedLink(fileId) {
        return new Promise((resolve, reject) => {
            this.#drive.files.get({
                fileId,
                fields: 'webViewLink'
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result.data.webViewLink);
            })
        });
    }


    /**
     * 獲取該資料的所有共享資料
     * @param {*} fileId 
     * @returns 
     */
    #listFilePermissions(fileId) {
        return new Promise((resolve, reject) => {
            this.#drive.permissions.list({
                fileId,
                fields: 'permissions(id, emailAddress)'
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result.data.permissions);
            });
        }).catch(error => {
            throw error;
        });
    }

    #mapGoogleMimeType(mimeType) {
        return new Promise((resolve, reject) => {
            this.#drive.about.get({
                fields: 'importFormats'
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result.data.importFormats[mimeType][0]);
            })
        }).catch(error => {
            throw error;
        });
    }
}