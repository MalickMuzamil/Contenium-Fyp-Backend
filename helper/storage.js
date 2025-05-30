import multer from 'multer';
import md5 from 'md5';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureUploadsFolderExists = () => {
    const uploadPath = path.join(__dirname, '../uploads');
    console.log(uploadPath)
    if (!fs.existsSync(uploadPath)) {
        console.log("Uploads folder does not exist. Creating folder...");
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    else {
        console.log("Uploads folder already exists.");
    }
};

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadsFolderExists();
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        var filepath = md5(Date.now() + req.user.id)
        const mimeType = file.mimetype.split('/');
        var fileType = mimeType[1];
        if (fileType == 'vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            fileType = 'xlsx'
        } else if (fileType == 'text/plain') {
            fileType = 'txt'
        } else if (fileType == 'text/csv') {
            fileType = 'csv'
        } else if (fileType == 'vnd.ms-excel') {
            fileType = 'xls'
        } else if (fileType == 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
            fileType = 'docx'
        } else if (fileType == 'msword') {
            fileType = 'doc'
        } else if (fileType == 'vnd.openxmlformats-officedocument.presentationml.presentation') {
            fileType = 'pptx'
        } else if (fileType == 'vnd.ms-powerpoint') {
            fileType = 'ppt'
        } else {
            fileType = mimeType[1];
        }
        const fileName = filepath + '.' + fileType;
        filepath = filepath + '.' + fileType
        cb(null, fileName);
    },
});
const diskStorageMultiple = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureUploadsFolderExists();
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        var filepath = md5(Date.now())
        const mimeType = file.mimetype.split('/');
        var fileType = mimeType[1];
        if (fileType == 'vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            fileType = 'xlsx'
        } else if (fileType == 'text/plain') {
            fileType = 'txt'
        } else if (fileType == 'text/csv') {
            fileType = 'csv'
        } else if (fileType == 'vnd.ms-excel') {
            fileType = 'xls'
        } else if (fileType == 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
            fileType = 'docx'
        } else if (fileType == 'msword') {
            fileType = 'doc'
        } else if (fileType == 'vnd.openxmlformats-officedocument.presentationml.presentation') {
            fileType = 'pptx'
        } else if (fileType == 'vnd.ms-powerpoint') {
            fileType = 'ppt'
        } else {
            fileType = mimeType[1];
        }
        const fileName = filepath + '.' + fileType;
        cb(null, fileName);
    },
});
const fileFilter = (req, file, cb) => {
    cb(null, true)
};

const storage = multer({ storage: diskStorage, fileFilter: fileFilter }).single(
    'file'
);

const storageMultiple = multer({
    storage: diskStorageMultiple,
    fileFilter: fileFilter
}).array(
    'files'
);


export { storage, storageMultiple }