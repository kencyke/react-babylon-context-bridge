import { EventState, Mesh, PointerDragBehavior, PointerInfo, Scene, Vector3 } from "@babylonjs/core"
import * as rx from "rxjs"

export type DragDataType = {
  data: {
    delta: Vector3
    dragPlanePoint: Vector3
    dragPlaneNormal: Vector3
    dragDistance: number
    pointerId: number
  }
}

export function createDragObservable(
  mesh: Mesh,
  options?: {
    dragAxis?: Vector3
    dragPlaneNormal?: Vector3
  }
): rx.Observable<DragDataType> {
  const behavior = new PointerDragBehavior(options)
  behavior.detachCameraControls = false
  mesh.addBehavior(behavior)
  return new rx.Observable<DragDataType>((subscriber) => {
    const observer = behavior.onDragObservable.add((data) => {
      subscriber.next({ data })
    })
    subscriber.add(() => behavior.onDragObservable.remove(observer))
  })
}

export type PointerEventType = {
  data: PointerInfo
  state: EventState
}

export function createPointerObservable(scene: Scene): rx.Observable<PointerEventType> {
  return new rx.Observable<PointerEventType>((subscriber) => {
    const observer = scene.onPointerObservable.add((data: PointerInfo, state: EventState) => {
      subscriber.next({ data, state })
    })
    subscriber.add(() => scene.onPointerObservable.remove(observer))
  })
}
