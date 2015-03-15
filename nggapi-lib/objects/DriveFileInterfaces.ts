/*
* Interface definition for the Drive.File resource.
* See https://developers.google.com/drive/v2/reference/files
*
* NB this is the manually coded version. This should be replaced by 
* an auto-generated version once the generator is written.
*/


module NgGapiDrive {

  /**
  * Definition of the list object returned by a Files.List method
  */
  export interface IDriveList {
    kind: string;
    etag: string;
    selfLink: string;
    nextPageToken: string;
    nextLink: string;
    items: Array<IDriveFile>
  }

  /**
  * Definition of the Drive.File resource
  */
  export interface IDriveFile {
    kind?: string;
    id?: string;
    etag?: string;
    selfLink?: string;
    webContentLink?: string;
    webViewLink?: string;
    alternateLink?: string;
    embedLink?: string;
    openWithLinks?: {};
    defaultOpenWithLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
    thumbnail?: {
      image?: string;
      mimeType?: string
    };
    title?: string;
    mimeType?: string;
    description?: string;
    labels?: {
      starred?: boolean;
      hidden?: boolean;
      trashed?: boolean;
      restricted?: boolean;
      viewed?: boolean
    };
    createdDate?: string;
    modifiedDate?: string;
    modifiedByMeDate?: string;
    lastViewedByMeDate?: string;
    sharedWithMeDate?: string;
    parents?: Array<{ id: string }>;
    downloadUrl?: string;
    exportLinks?: {}
    indexableText?: {
      text?: string
    };
    userPermission?: {
      kind?: string;
      etag?: string;
      id?: string;
      selfLink?: string;
      name?: string;
      emailAddress?: string;
      domain?: string;
      role?: string;
      additionalRoles?: Array<string>;
      type?: string;
      value?: string;
      authKey?: string;
      withLink?: boolean;
      photoLink?: string;
    }
    originalFilename?: string;
    fileExtension?: string;
    md5Checksum?: string;
    fileSize?: number;
    quotaBytesUsed?: number;
    ownerNames?: Array<string>;
    owners?: Array<
      {
        kind?: string;
        displayName?: string;
        picture?: {
          url?: string
        };
        isAuthenticatedUser?: boolean;
        permissionId?: string
      }
      >;
    lastModifyingUserName?: string;
    lastModifyingUser?: {
      kind?: string;
      displayName?: string;
      picture?: {
        url?: string
      };
      isAuthenticatedUser?: boolean;
      permissionId?: string
    };
    editable?: boolean;
    copyable?: boolean;
    writersCanShare?: boolean;
    shared?: boolean;
    explicitlyTrashed?: boolean;
    appDataContents?: boolean;
    headRevisionId?: string;
    properties?: Array<{
      kind: string;
      etag: string;
      selfLink: string;
      key: string;
      visibility: string;
      value: string
    }>;
    imageMediaMetadata?: {
      width?: number;
      height?: number;
      rotation?: number;
      location?: {
        latitude?: number;
        numberitude?: number;
        altitude?: number
      };
      date?: string;
      cameraMake?: string;
      cameraModel?: string;
      exposureTime?: number;
      aperture?: number;
      flashUsed?: boolean;
      focalLength?: number;
      isoSpeed?: number;
      meteringMode?: string;
      sensor?: string;
      exposureMode?: string;
      colorSpace?: string;
      whiteBalance?: string;
      exposureBias?: number;
      maxApertureValue?: number;
      subjectDistance?: number;
      lens?: string
    }
  }
}
