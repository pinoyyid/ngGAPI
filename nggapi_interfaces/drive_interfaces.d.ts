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
   https://developers.google.com/drive/v2/reference/about
   */
  export interface IDriveAbout {
    "kind"?: string;
    "etag"?: string;
    "selfLink"?: string;
    "name"?: string;
    "user"?: {
      "kind": string;
      "displayName": string;
      "picture": {
        "url": string
      };
      "isAuthenticatedUser": boolean;
      "permissionId": string;
      "emailAddress": string
    };
    "quotaBytesTotal"?: number;
    "quotaBytesUsed"?: number;
    "quotaBytesUsedAggregate"?: number;
    "quotaBytesUsedInTrash"?: number;
    "quotaType"?: string;
    "quotaBytesByService"?: [
        {
          "serviceName": string;
          "bytesUsed": number
        }
        ];
    "largestChangeId"?: number;
    "remainingChangeIds"?: number;
    "rootFolderId"?: string;
    "domainSharingPolicy"?: string;
    "permissionId"?: string;
    "importFormats"?: [
        {
          "source"?: string;
          "targets": [
              string
              ]
        }
        ];
    "exportFormats"?: [
        {
          "source": string;
          "targets": [
              string
              ]
        }
        ];
    "additionalRoleInfo"?: [
        {
          "type": string;
          "roleSets": [
              {
                "primaryRole": string;
                "additionalRoles": [
                    string
                    ]
              }
              ]
        }
        ];
    "features"?: [
        {
          "featureName": string;
          "featureRate": number
        }
        ];
    "maxUploadSizes"?: [
        {
          "type": string;
          "size": number
        }
        ];
    "isCurrentAppInstalled"?: boolean;
    "languageCode"?: string;
    "folderColorPalette"?: [
        string
        ]
  }


  /**
   * https://developers.google.com/drive/v2/reference/changes
   */
  export interface IDriveChange {
    "kind"?: string;
    "id"?: number;
    "fileId"?: string;
    "selfLink"?: string;
    "deleted"?: boolean;
    "modificationDate"?: string;
    "file"?: IDriveFile
  }


  /*
  ---------- Interfaces of the various services -----------
   */

  /**
   * Interface definition for the OauthService. Mostly useful for a mock service
   */
  export interface IOauthService {
    getAccessToken(): mng.IPromise<GoogleApiOAuth2TokenObject>;
    refreshAccessToken(): mng.IPromise<GoogleApiOAuth2TokenObject>;
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
      get(params:IDriveFileGetParameters):IDriveResponseObject<IDriveFile,IDriveFile>;
      list(params?:IDriveFileListParameters, excludeTrashed?):IDriveResponseObject<IDriveFileList, IDriveFile[]>;
      insert(file:IDriveFile, storeId?:boolean):IDriveResponseObject<IDriveFile,IDriveFile>;
      insertWithContent(file:IDriveFile, params:IDriveFileInsertParameters, content:string, storeId?:boolean):IDriveResponseObject<IDriveFile,IDriveFile>;
      update(file:IDriveFile, params?:IDriveFileUpdateParameters, content?:string):IDriveResponseObject<IDriveFile,IDriveFile>;
      patch(params:{fileId:string; resource:IDriveFile}):IDriveResponseObject<IDriveFile,IDriveFile>;
      trash(params:{fileId:string}):IDriveResponseObject<IDriveFile,IDriveFile>;
      untrash(params:{fileId:string}):IDriveResponseObject<IDriveFile,IDriveFile>;
      del(params:{fileId:string}):IDriveResponseObject<any,any>;
      touch(params:{fileId:string}):IDriveResponseObject<IDriveFile,IDriveFile>;
      watch(params:{fileId:string;alt?:string; revisionId?:string}, resource:IWatchBody):IDriveResponseObject<IApiChannel,IApiChannel>;
      emptyTrash():IDriveResponseObject<any,any>;
      //list(params:IDriveListParameters):IDriveresponseObject;
    }
    about:{
      get(params?:IDriveAboutGetParameters):IDriveResponseObject<IDriveAbout,IDriveAbout>;
    }
    changes:{
      get(params:{changeId: number}):IDriveResponseObject<IDriveChange,IDriveChange>;
      list(params?:IDriveChangeListParameters):IDriveResponseObject<IDriveChangeList,IDriveChange[]>;
      watch(resource:IWatchBody):IDriveResponseObject<IApiChannel,IApiChannel>;
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
  export interface IDriveResponseObject<P,D> {
    //promise:mng.IPromise<{data:mng.IHttpPromiseCallbackArg<P>}>;
    promise:mng.IPromise<mng.IHttpPromiseCallbackArg<P>>;
    data:D
    //data:IDriveFile | Array<IDriveFile> | {media: string};
    headers:(name:string)=>string
  }

  /**
   * Definition of the list object returned by a Files.List method
   */
  export interface IDriveFileList {
    kind: string;
    etag: string;
    selfLink: string;
    nextPageToken: string;
    nextLink: string;
    items: Array<IDriveFile>
  }

  export interface IDriveFileListParameters {
    corpus?:string;	                    //The body of items (files/documents) to which the query applies.  Acceptable values are: "DEFAULT": The items that the user has accessed. "DOMAIN": Items shared to the user's domain.
    maxResults?:number;                 // Maximum number of files to return. Acceptable values are 0 to 1000, inclusive. (Default: 100)
    pageToken?:string;	                // Page token for files.
    q?:string;                          // Query string for searching files. See https://developers.google.com/drive/search-parameters for more information about supported fields and operations.
    fields?:string;                     // urlencoded list of fields to include in response
  }

  export interface IDriveFileInsertParameters {
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

  export interface IDriveFileGetParameters {
    fileId:string;                       //	The ID for the file in question.
    acknowledgeAbuse?:boolean;           // Whether the user is acknowledging the risk of downloading known malware or other abusive files. Ignored unless alt=media is specified. (Default: false)
    alt?:string;                         // Specifies the type of resource representation to return. The default is 'json' to return file metadata. Specifying 'media' will cause the file content to be returned.
    fields?:string;
    revisionId?:string;                  //	Specifies the Revision ID that should be downloaded. Ignored unless alt=media is specified.
    updateViewedDate?:boolean;           //	Whether to update the view date after successfully retrieving the file. (Default: false)
  }

  export interface IDriveFileUpdateParameters {
    uploadType?:string;                   // The type of upload request to the /upload URI. Acceptable values are: media - Simple upload. Upload the media only, without any metadata. multipart - Multipart upload. Upload both the media and its metadata, in a single request. resumable - Resumable upload. Upload the file in a resumable fashion, using a series of at least two requests where the first request includes the metadata.
    fileId?:string;                        // The ID of the file to update.
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

  export interface IWatchBody {
    id:string;                            // A UUID or similar unique string that identifies this channel.
    token?:string;                        // An arbitrary string delivered to the target address with each notification delivered over this channel. Optional.
    expiration?:number;                   // Date and time of notification channel expiration, expressed as a Unix timestamp, in milliseconds. Optional.
    type?:string;	                      // The type of delivery mechanism used for this channel. The only option is web_hook.
    address?:string;                      // The address where notifications are delivered for this channel.
  }

  export interface IApiChannel {
    kind: string;
    id: string;
    resourceId: string;
    resourceUri: string;
    token: string;
    expiration: number;
  }

  /**
   * Definition of the list object returned by a Changes.List method
   */
  export interface IDriveChangeList {
    kind: string;
    etag: string;
    selfLink: string;
    nextPageToken: string;
    nextLink: string;
    largestChangeId: number;
    items: Array<IDriveChange>
  }

  export interface IDriveChangeListParameters {
    includeDeleted?:boolean	;           // Whether to include deleted items. (Default: true)
    includeSubscribed?:boolean;         // Whether to include public files the user has opened and shared files. When set to false, the list only includes owned files plus any shared or public files the user has explicitly added to a folder they own. (Default: true)
    startChangeId?:number;              // Change ID to start listing changes from.
    maxResults?:number;                 // Maximum number of files to return. Acceptable values are 0 to 1000, inclusive. (Default: 100)
    pageToken?:string;	                // Page token for files.
    fields?:string;                     // this isn't documented, but I think applies to all list methods
  }

  export interface IDriveAboutGetParameters {
    includeSubscribed?:boolean;          // When calculating the number of remaining change IDs, whether to include public files the user has opened and shared files. When set to false, this counts only change IDs for owned files and any shared or public files that the user has explicitly added to a folder they own. (Default: true)
    maxChangeIdCount?:number;            // Maximum number of remaining change IDs to count
    startChangeId?:number;               // Change ID to start counting from when calculating number of remaining change IDs
  }





  /**
   * The OAuth 2.0 token object represents the OAuth 2.0 token and any associated data.
   */
  export interface GoogleApiOAuth2TokenObject {
    /**
     * The OAuth 2.0 token. Only present in successful responses
     */
    access_token: string;
    /**
     * Details about the error. Only present in error responses
     */
    error?: string;
    /**
     * The duration, in seconds, the token is valid for. Only present in successful responses
     */
    expires_in?: number;
    /**
     * The Google API scopes related to this token
     */
    state?: string;
  }
}


