export interface GalleriesRequest {
  scheduleId: string;
  linkVideos?: string;
  linkPhotos: string;
  expiredAt: string;
}

export interface GalleryData {
  id: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  linkVideos?: string;
  linkPhotos: string;
  expiredAt: string;
  createdId: string;
}
