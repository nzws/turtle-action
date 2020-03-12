import { writeFile } from 'fs';

const base64ToBin = (base64, filePath) =>
  new Promise((resolve, reject) => {
    const buffer = Buffer.from(base64, 'base64');

    writeFile(filePath, buffer, 'binary', err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

export default base64ToBin;
