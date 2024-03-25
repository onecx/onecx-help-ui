import { Injectable } from '@angular/core'
import { Observable, OperatorFunction, filter } from 'rxjs'
import { HelpsInternalAPIService } from 'src/app/shared/generated'

@Injectable({
  providedIn: 'any'
})
export class HelpsRemoteAPIService extends HelpsInternalAPIService {
  protected override basePath: string = ''

  setBasePath(basePath: Observable<string | undefined>) {
    basePath
      .pipe(filter((path) => path !== undefined) as OperatorFunction<string | undefined, string>)
      .subscribe((path) => {
        this.basePath = path
        this.configuration.basePath = path
      })
  }
}
