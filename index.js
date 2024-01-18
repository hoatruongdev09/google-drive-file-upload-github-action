const { google } = require("googleapis")
const fs = require('fs')
const fsAsync = require('fs/promises')
const path = require('path');

const core = require('@actions/core')
const github = require('@actions/github')

const executeAction = async (filePath, uploadFolderId, uploadFileName, overwrite, base64Credential) => {
    try {

        const text = Buffer.from(base64Credential, 'base64').toString('ascii')
        await fsAsync.writeFile("credentials.json", text)
    } catch (e) {
        console.error(e)
        throw e
    }

    const credentialFilename = "credentials.json";
    const scopes = ['https://www.googleapis.com/auth/drive.file'];

    const auth = new google.auth.GoogleAuth({ keyFile: credentialFilename, scopes: scopes })
    const drive = google.drive({ version: "v3", auth })

    try {
        if (overwrite) {
            const files = await searchFolder(drive, uploadFolderId)
            await deleteIfFileExist(drive, files, uploadFileName)
        }
        const file = await uploadFile(drive, filePath, uploadFolderId, uploadFileName)
        const fileId = file.data.id;
        await setFilePublic(drive, fileId)
        const fileUrl = await getSharedFileUrl(drive, fileId)
        const { webContentLink, webViewLink } = fileUrl.data
        return { fileId, webContentLink, webViewLink }
    } catch (error) {
        throw error
    }
}
const deleteIfFileExist = async (drive, files, uploadFileName) => {

    try {
        for (let file of files) {
            if (file.name !== uploadFileName) { continue; }
            const deleteFile = await drive.files.delete({
                fileId: file.id
            })
            console.log(`deleted file: ${file.name}, ${deleteFile.status}`)
        }
    } catch (error) {
        throw error
    }
}

const searchFolder = async (drive, folderId) => {
    try {
        const response = await drive.files.list({
            pageSize: 100,
            q: `'${folderId}' in parents and trashed=false`
        })
        return response.data.files
    } catch (error) {
        throw error
    }
}

const uploadFile = async (drive, filePath, uploadFolderId, uploadFileName) => {
    try {
        const fileName = path.basename(filePath)
        console.log(`start upload file: ${fileName}`)
        const file = await drive.files.create({
            media: {
                body: fs.createReadStream(filePath)
            },
            fields: 'id',
            requestBody: {
                name: uploadFileName,
                parents: [uploadFolderId]
            }
        })
        console.log(`finished uploading file, file id: ${file.data.id}`)
        return file
    } catch (error) {
        throw error
    }
}

const setFilePublic = async (drive, fileId, fileRole = 'reader', shareType = 'anyone') => {
    try {
        console.log(`set file public with role ${fileRole} and share type ${shareType}`)
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: fileRole,
                type: shareType
            }
        })
        console.log(`finished sharing file`)
    } catch (error) {
        throw error
    }
}

const getSharedFileUrl = async (drive, fileId) => {
    try {
        console.log(`generate file url`)
        return await drive.files.get({
            fileId,
            fields: 'webViewLink, webContentLink'
        })
    } catch (error) {
        throw error
    }
}

const doTask = async () => {
    try {
        const filePath = core.getInput('file-path')
        const serviceAccountJson = core.getInput('service-account-json')
        const folderId = core.getInput('upload-to-folder-id')
        const uploadFileName = core.getInput('upload-name')
        const overwrite = core.getInput('overrwrite')
        const { fileId, webContentLink, webViewLink } = await executeAction(filePath, folderId, uploadFileName, overwrite, serviceAccountJson)
        console.log(`result: fileId: ${fileId}\nfile web content link: ${webContentLink}\nfile web view link: ${webViewLink}`)
        core.setOutput('file-id', fileId)
        core.setOutput('web-content-link', webContentLink)
        core.setOutput('web-view-link', webViewLink)
    } catch (error) {
        console.error(error)
        core.setFailed(error.message)
    }
}

doTask()