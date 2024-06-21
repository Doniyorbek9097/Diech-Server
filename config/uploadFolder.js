exports.useUploadFolder = () => process.env.NODE_ENV === 'production' ? "../../../../mnt/data/uploads" : "./uploads";
