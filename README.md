
GitHub action to upload a file from Google Drive.

For instructions on how to set up service account required to download file, please follow this steps:
1. Create a project in the [Google Cloud Platform Console](https://console.cloud.google.com/) .
2. Enable [Google Drive API](https://developers.google.com/drive/api/v3/enable-drive-api) in new project.
3. Create a service account for new project.
4. Create authentication keys for the service account and download it as json file.
5. Share the file that you want to download to the service account in google drive.
6. Encode your service account json file content to base64 and store in your action secret

### Inputs
- file-path: Path of file that need to be uploaded
- service-account-json: base64 encoded of service account json file
- upload-name: Uploaded file name that store on drive
- upload-to-folder-id: Folder that should contains uploaded file
- overrwrite: Overwrite existed filed or not
### output
- file-id: File id of uploaded file
- web-content-link: Link download as web content
- web-view-link: Link download as web view
