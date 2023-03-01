import invariant from 'tiny-invariant'
import { TickMath } from './tickMath'

/**
 * Returns the closest tick that is nearest a given tick and usable for the given tick spacing
 * @param tick the target tick
 * @param tickSpacing the spacing of the pool
 */
export function nearestUsableTick(tick: number, tickSpacing: number,even?:boolean) {
  invariant(Number.isInteger(tick) && Number.isInteger(tickSpacing), 'INTEGERS')
  invariant(tickSpacing > 0, 'TICK_SPACING')
  invariant(tick >= TickMath.MIN_TICK && tick <= TickMath.MAX_TICK, 'TICK_BOUND')
  const rounded = Math.round(tick / tickSpacing) * tickSpacing
  const evenMultiple=Math.round(Math.round(tick / tickSpacing)/2)*2
  const roundedEven = (evenMultiple) * tickSpacing
  const roundedOdd = (evenMultiple-1) * tickSpacing
  if(even===undefined)
  if (rounded < TickMath.MIN_TICK) return rounded + tickSpacing
  else if (rounded > TickMath.MAX_TICK) return rounded - tickSpacing
  else return rounded
  if(even)
  if (roundedEven < TickMath.MIN_TICK) return roundedEven + (tickSpacing*2)
  else if (roundedEven > TickMath.MAX_TICK) return roundedEven - (tickSpacing*2)
  else return roundedEven
  else
  if (roundedOdd < TickMath.MIN_TICK) return roundedOdd + (tickSpacing*2)
  else if (roundedOdd > TickMath.MAX_TICK) return roundedOdd - (tickSpacing*2)
  else return roundedOdd
}
