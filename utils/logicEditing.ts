import { Action, LogicBlock } from '../types';

/** Edit the action exposed by the UI without discarding the rest of the event. */
export function updateLogicAction(
  logic: LogicBlock[] = [],
  eventType: 'click' | 'hover',
  action?: Action,
): LogicBlock[] {
  if (!action) return logic.filter(block => block.event?.type !== eventType);
  const index = logic.findIndex(block => block.event?.type === eventType);
  if (index < 0) return [...logic, { event: { type: eventType }, actions: [action] }];
  return logic.map((block, i) => i === index
    ? { ...block, actions: [action, ...block.actions.slice(1)] }
    : block);
}
