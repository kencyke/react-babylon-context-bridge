import React, { useCallback, useEffect } from "react"
import { Suspense, useState, useRef } from "react"
import { ArcRotateCamera, Color3, Mesh, Vector3 } from "@babylonjs/core"
import { Engine, Scene, useBeforeRender, useHover } from "react-babylonjs"
import { Provider, atom, useAtom, PrimitiveAtom, useBridge, Bridge } from "jotai"
import { createDragObservable } from "./observables"
import "./App.css"

const skyblue = Color3.FromHexString("#87CEEB")
const darkblue = Color3.FromHexString("#00008B")
const black = Color3.Black()

type BoxType = {
  name: string
  position: Vector3
  hovered: boolean
}

const Box: React.VFC<{ box: PrimitiveAtom<BoxType> }> = ({ box }) => {
  const [{ name, position, hovered }, setBox] = useAtom(box)
  const meshRef = useRef<Mesh | null>(null)

  const setHover = useCallback((x: boolean) => setBox((prev) => ({ ...prev, hovered: x })), [setBox])
  useHover(
    () => setHover(true),
    () => setHover(false),
    meshRef
  )

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    const subscription = createDragObservable(mesh).subscribe((data) => {
      setBox((prev) => ({
        ...prev,
        position: prev.position.add(data.data.delta),
      }))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setBox])

  useBeforeRender(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <box name={name} position={position} ref={meshRef}>
      <standardMaterial name={`${name}-mat`} diffuseColor={hovered ? skyblue : darkblue} specularColor={black} />
    </box>
  )
}

const Main: React.VFC<{ boxes: PrimitiveAtom<BoxType>[] }> = ({ boxes }) => {
  const cameraRef = useRef<ArcRotateCamera>()

  useEffect(() => {
    const camera = cameraRef.current
    if (!camera) {
      return
    }
    camera.inputs.removeByType("ArcRotateCameraPointersInput")
    camera.inputs.removeByType("ArcRotateCameraMouseWheelInput")
  }, [])

  return (
    <>
      <arcRotateCamera name="camera1" target={Vector3.Zero()} alpha={Math.PI / 2} beta={0} radius={8} ref={cameraRef} />
      <hemisphericLight name={"light1"} direction={new Vector3(0, 0, 1)} intensity={0.8} />
      <pointLight name={"light2"} position={new Vector3(100, 100, 100)} intensity={0.7} />
      {boxes.map((box, index) => (
        <Box key={index} box={box} />
      ))}
    </>
  )
}

const Layout: React.VFC = () => {
  const [boxes, setBoxes] = useState<PrimitiveAtom<BoxType>[]>([])
  const [count, setCount] = useState(0)
  const add = (): void => {
    const box = atom<BoxType>({
      name: `box-${count}`,
      position: new Vector3(6 * Math.random() - 3, 6 * Math.random() - 3, 0),
      hovered: false,
    })
    setCount((prev) => prev + 1)
    setBoxes((prev) => [...prev, box])
  }
  return (
    <div className="layout">
      <div>
        <button onClick={add}>Add</button>
      </div>
      <Engine>
        <Scene>
          <Bridge value={useBridge()}>
            <Main boxes={boxes} />
          </Bridge>
        </Scene>
      </Engine>
      <Engine>
        <Scene>
          <Bridge value={useBridge()}>
            <Main boxes={boxes} />
          </Bridge>
        </Scene>
      </Engine>
    </div>
  )
}

const App: React.VFC = () => {
  return (
    <Provider>
      <Suspense fallback="Loading...">
        <Layout />
      </Suspense>
    </Provider>
  )
}

export default App
