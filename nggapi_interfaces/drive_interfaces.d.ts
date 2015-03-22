/// <reference path="angular_cropped.d.ts"/>

/*
 ---------- Interfaces of the Drive Resources as defined within the Google documentation -----------
 */

/*
 * Interface definition for the Drive.File resource.
 * See https://developers.google.com/drive/v2/reference/files
 *
 * NB this is the manually coded version. This should be replaced by
 * an auto-generated version once the generator is written.
 */


declare module NgGapi{



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



  /*
  ---------- Interfaces of the various services -----------
   */

  /**
   * Interface definition for the OauthService. Mostly useful for a mock service
   */
  export interface IOauthService {
    getAccessToken(): string;
    refreshAccessToken(): void;
  }

  /**
   * Interface definition for the HttpService. Mostly useful for a mock service
   */
  export interface IHttpService {
    get$http():mng.IHttpService;
    doHttp(configObject: mng.IRequestConfig):mng.IPromise<any>;
  }


  /**
   * Interface definition for the DriveService. Mostly useful for a mock service
   */
  export interface IDriveService {
    getHttpService():NgGapi.IHttpService;
    files:{
      get(params:IDriveGetParameters):IDriveResponseObject<NgGapi.IDriveFile>;
      list(params:IDriveListParameters, excludeTrashed):IDriveResponseObject<NgGapi.IDriveFile[]>;
      insert(file:IDriveFile, params?:IDriveInsertParameters, base64EncodedContent?:string):IDriveResponseObject<NgGapi.IDriveFile>;
      update(params:IDriveUpdateParameters):IDriveResponseObject<NgGapi.IDriveFile>;
      patch(params:IDriveUpdateParameters):IDriveResponseObject<NgGapi.IDriveFile>;
      trash(params:{fileId:string}):IDriveResponseObject<NgGapi.IDriveFile>;
      untrash(params:{fileId:string}):IDriveResponseObject<NgGapi.IDriveFile>;
      del(params:{fileId:string}):IDriveResponseObject<NgGapi.IDriveFile>;
      //list(params:IDriveListParameters):IDriveresponseObject;
    }
  }

  /*
   ---------- Interfaces of the various objects and data structures -----------
   */

  /**
   * all methods will return this object containing a promise and data, where data would be one of
   * an object with a single property, 'media' which is the file content (i.e. from a Get alt=media),
   * the file meta data (e.g. from an Insert)
   * an array of file meta data (e.g. from a List)
   *
   * The promise will resolve on complete success, including fetching all pages in a list.
   * For lists, the promise will notify after each page
   * Failure is total failure, i.e. after any retries
   */
  export interface IDriveResponseObject<T> {
    promise:mng.IPromise<{data:IDriveFile}>;
    data:T
    //data:IDriveFile | Array<IDriveFile> | {media: string};
    headers:(name:string)=>string
  }

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

  export interface IDriveListParameters {
    corpus?:string;	                    //The body of items (files/documents) to which the query applies.  Acceptable values are: "DEFAULT": The items that the user has accessed. "DOMAIN": Items shared to the user's domain.
    maxResults?:number;                 // Maximum number of files to return. Acceptable values are 0 to 1000, inclusive. (Default: 100)
    pageToken?:string;	                // Page token for files.
    q?:string;                          // Query string for searching files. See https://developers.google.com/drive/search-parameters for more information about supported fields and operations.
    fields?:string;                     // urlencoded list of fields to include in response
  }

  export interface IDriveInsertParameters {
    uploadType:string;                   // The type of upload request to the /upload URI. Acceptable values are: media - Simple upload. Upload the media only, without any metadata. multipart - Multipart upload. Upload both the media and its metadata, in a single request. resumable - Resumable upload. Upload the file in a resumable fashion, using a series of at least two requests where the first request includes the metadata.
    convert?:boolean;                    // Whether to convert this file to the corresponding Google Docs format. (Default: false)
    ocr?:boolean;                        // Whether to attempt OCR on .jpg, .png, .gif, or .pdf uploads. (Default: false)
    ocrLanguage?:string;                 //  If ocr is true, hints at the language to use. Valid values are ISO 639-1 codes.
    pinned?:boolean;                     // Whether to pin the head revision of the uploaded file. A file can have a maximum of 200 pinned revisions. (Default: false)
    timedTextLanguage?:string;           // The language of the timed text.
    timedTextTrackName?:string;          // The timed text track name.
    useContentAsIndexableText?:boolean;  // Whether to use the content as indexable text. (Default: false)
    visibility?:string;                  // The visibility of the new file. This parameter is only relevant when convert=false.  Acceptable values are: "DEFAULT": The visibility of the new file is determined by the user's default visibility/sharing policies. (default) "PRIVATE": The new file will be visible to only the owner.
  }

  export interface IDriveGetParameters {
    fileId:string;                       //	The ID for the file in question.
    acknowledgeAbuse?:boolean;           // Whether the user is acknowledging the risk of downloading known malware or other abusive files. Ignored unless alt=media is specified. (Default: false)
    alt?:string;                         // Specifies the type of resource representation to return. The default is 'json' to return file metadata. Specifying 'media' will cause the file content to be returned.
    fields?:string;
    revisionId?:string;                  //	Specifies the Revision ID that should be downloaded. Ignored unless alt=media is specified.
    updateViewedDate?:boolean;           //	Whether to update the view date after successfully retrieving the file. (Default: false)
  }

  export interface IDriveUpdateParameters {
    fileId:string;                        // The ID of the file to update.
    addParents?:string;                   // Comma-separated list of parent IDs to add.
    convert?:boolean;                     // Whether to convert this file to the corresponding Google Docs format. (Default: false)
    newRevision?:boolean;                 // Whether a blob upload should create a new revision. If false, the blob data in the current head revision is replaced. If true or not set, a new blob is created as head revision, and previous revisions are preserved (causing increased use of the user's data storage quota). (Default: true)
    ocr?:boolean;                         // Whether to attempt OCR on .jpg, .png, .gif, or .pdf uploads. (Default: false)
    ocrLanguage?:string;                  //  If ocr is true, hints at the language to use. Valid values are ISO 639-1 codes.
    pinned?:boolean;                      // Whether to pin the head revision of the uploaded file. A file can have a maximum of 200 pinned revisions. (Default: false)
    timedTextLanguage?:string;            // The language of the timed text.
    timedTextTrackName?:string;           // The timed text track name.
    useContentAsIndexableText?:boolean;   // Whether to use the content as indexable text. (Default: false)
    removeParents?:string;                // Comma-separated list of parent IDs to remove.
    setModifiedDate?:boolean;             // Whether to set the modified date with the supplied modified date. (Default: false)
    updateViewedDate?:boolean;            // Whether to update the view date after successfully updating the file. (Default: true)
  }
}


