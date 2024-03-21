import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http'
import { map, Observable } from 'rxjs'
import { HelpData } from '../model/help-data.model'

export class HelpAPIService {
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  }
  constructor(private httpClient: HttpClient) {}

  /* eslint-disable @typescript-eslint/no-unused-vars */
  getHelpDataItem(
    bffUrl: string,
    baseUrl: string,
    appId: string,
    helpItemId: string,
    type = 'PAGE'
  ): Observable<HelpData> {
    return this.httpClient
      .get<HelpData[]>(`${bffUrl}/${baseUrl}/${appId}/helpItems`, {
        params: {
          helpItemId
        }
      })
      .pipe(map((helpItems) => helpItems[0]))
  }

  saveHelpPage(bffUrl: string, baseUrl: string, appId: string, helpItem: HelpData): Observable<HttpResponse<any>> {
    if (helpItem.id) {
      return this.httpClient.patch(`${bffUrl}/${baseUrl}/${appId}/helpItems/${helpItem.id}`, helpItem, {
        observe: 'response'
      })
    } else {
      return this.httpClient.post(`${bffUrl}/${baseUrl}/${appId}/helpItems`, helpItem, {
        observe: 'response'
      })
    }
  }

  saveHelpPageLegacy(bffUrl: string, baseUrl: string, helpItem: HelpData): Observable<HttpResponse<any>> {
    return this.httpClient.post(`${bffUrl}/${baseUrl}/helpdata`, helpItem, {
      headers: {
        'Content-Type': 'application/v1+json',
        Accept: 'application/v1+json'
      },
      observe: 'response'
    })
  }
}
