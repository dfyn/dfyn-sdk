// entities/route.ts

import { Route as V1RouteSDK, Pair } from '../index'
import { V2Route as V2RouteSDK, Pool } from '../index'
import { Protocol } from './protocol'
import { Currency, Price, Token } from '../index'
import { MixedRouteSDK } from './mixedRoute/route'
type TPool = Pair | Pool

export interface IRoute {
  protocol: Protocol
  // array of pools if v3 or pairs if v2
  pools: TPool[]
  path: Token[]
  midPrice: Price
  input: Currency
  output: Currency
}

// V1 route wrapper
export class RouteV1
  extends V1RouteSDK
  implements IRoute
{
  public readonly protocol: Protocol = Protocol.V1
  public readonly pools: Pair[]

  constructor(v1Route: V1RouteSDK) {
    super(v1Route.pairs, v1Route.input, v1Route.output)
    this.pools = this.pairs
  }
}

// V2 route wrapper
export class RouteV2
  extends V2RouteSDK
  implements IRoute
{
  public readonly protocol: Protocol = Protocol.V2
  public readonly path: Token[]

  constructor(v2Route: V2RouteSDK) {
    super(v2Route.pools, v2Route.input, v2Route.output)
    this.path = v2Route.tokenPath
  }
}

// UniV3 route wrapper
export class RouteUniV2
  extends V2RouteSDK
  implements IRoute
{
  public readonly protocol: Protocol = Protocol.UNIV3
  public readonly path: Token[]

  constructor(v2Route: V2RouteSDK) {
    super(v2Route.pools, v2Route.input, v2Route.output)
    this.path = v2Route.tokenPath
  }
}

// Mixed route wrapper
export class MixedRoute
  extends MixedRouteSDK
  implements IRoute
{
  public readonly protocol: Protocol = Protocol.MIXED

  constructor(mixedRoute: MixedRouteSDK) {
    super(mixedRoute.pools, mixedRoute.input, mixedRoute.output)
  }
}