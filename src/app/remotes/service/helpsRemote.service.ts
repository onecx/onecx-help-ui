import { Injectable } from '@angular/core'
import { HelpsInternalAPIService } from 'src/app/shared/generated'

@Injectable({
  providedIn: 'any'
})
export class HelpsRemoteAPIService extends HelpsInternalAPIService {}
