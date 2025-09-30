import { uploadFile } from './api';

export const uploadImage = async (file) => {
  return uploadFile('/upload/image', file);
}; 