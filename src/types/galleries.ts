export interface GalleriesRequest {
  scheduleId: string;
  linkVideos?: string;
  linkVideosMatch?: string | null;
  linkVideosSlowmo?: string | null;
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
  scheduleId: string;
  community: string;
  linkVideosMatch?: string;
  linkVideosSlowmo?: string;
  linkPhotos: string;
  expiredAt: string;
  createdId: string;
}
