import { join } from 'path';

export const UPLOADS_ROOT = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
export const PRODUCT_IMAGES_DIR = join(UPLOADS_ROOT, 'products');
export const RETURN_PHOTOS_DIR = join(UPLOADS_ROOT, 'returns');
