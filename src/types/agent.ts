export interface IncomingFormFields {
  [key: string]: any; // Add specific keys like name, email if needed
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
