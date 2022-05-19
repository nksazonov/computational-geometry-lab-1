import React, { useState } from 'react';
import { Circle, Layer, Line, Stage } from 'react-konva';
import config, { colorsConfig } from './config';
import {Edge, Point} from './types/geometry';
import {
  nearestPoint as getNearestPoint,
  nearestEdge as getNearestEdge,
} from './algorithms/point-locations';
import { locatePoint, pointKey } from './algorithms/monotone_subdivisions';
import { transformEdges, transformPoint, transformPoints } from './algorithms/transform';

function App() {
  const [points, setPoints] = useState([] as Point[]);
  const [edges, setEdges] = useState([] as Edge[]);
  const [selectedPoint, setSelectedPoint] = useState(null as Point | null);
  const [selectedEdge, setSelectedEdge] = useState(null as Edge | null);

  const handleStageClick = (e: any) => {
    let {x, y} = e.currentTarget.getPointerPosition();
    
    x = Math.round(x);
    y = Math.round(y);

    const clickedPoint: Point = {x, y};

    const nearestPoint = getNearestPoint(clickedPoint, points, config.distanceEpsilon);

    if (nearestPoint === null) {
      // if not present - Check whether trying to select Edge
      const nearestEdge = getNearestEdge(clickedPoint, edges, config.distanceEpsilon);

      if (nearestEdge === null) {
        // if not selecting edge - add new point
        setPoints([...points, clickedPoint]);
        setSelectedEdge(null);

        if (selectedPoint !== null) {
          // if point was selected - create Edge to it
          setEdges([...edges, {from: selectedPoint, to: clickedPoint}]);
          setSelectedPoint(null);
        }
      } else {
        // if selecting edge - select edge, unselect point
        if (nearestEdge === selectedEdge) {
          // if nearest edge = selected edge - deselect
          setSelectedEdge(null);
        } else {
          // if nearest edge != selected edge - select
          setSelectedPoint(null);
          setSelectedEdge(nearestEdge);
          console.log(pointKey(nearestEdge.from), '-', pointKey(nearestEdge.to));
        }
      }

    } else {
      // if present - Mark selected

      if (selectedPoint !== null) {
        // if point was selected - create Edge to it

        if (selectedPoint === nearestPoint) {
          // if selected is the same as nearest - deselect
          setSelectedPoint(null);
        } else {
          // if selected is not the same as nearest - create edge to it
          setEdges([...edges, {from: selectedPoint, to: nearestPoint}]);
          setSelectedPoint(null);
        }
      } else {
        // if no point was selected - select point, unselect edge
        setSelectedEdge(null);
        setSelectedPoint(nearestPoint);
        console.log(nearestPoint);
      }
    }
  }

  const handleClearClick = () => {
    setPoints([]);
    setEdges([]);
    setSelectedPoint(null);
    setSelectedEdge(null);
  }

  const handleDeleteClick = () => {
    if (selectedPoint) {
      setPoints([...points.filter(p => p !== selectedPoint)]);
      setEdges([...edges.filter(e => e.from !== selectedPoint && e.to !== selectedPoint)]);
      setSelectedPoint(null);
    } else {
      setEdges([...edges.filter(e => e !== selectedEdge)]);
      setSelectedEdge(null);
    }
  }

  const handleRunClick = () => {
    setEdges(transformEdges(
      locatePoint(
        transformPoint(points[0]),
        transformPoints(points),
        transformEdges(edges)
      )
    ));
    console.log(edges);
    
  }

  return (
    <div className="w-screen h-screen bg-slate-700 p-4 border-box">
        <Stage
          width={window.innerWidth * config.canvasWidthMultiplier}
          height={window.innerHeight * config.canvasHeightMultiplier}
          className="border-box bg-slate-800 rounded-3xl cursor-crosshair mb-4"
          onClick={handleStageClick}
        >
          <Layer>
            {
              edges.map((e) => <Line
                points={[e.from.x, e.from.y, e.to.x, e.to.y]}
                strokeWidth={config.lineWidth}
                stroke={e === selectedEdge ? colorsConfig.selectedEdge : colorsConfig.edge}
                lineCap="round"
                lineJoin="round"
                key={`link-${pointKey(e.from)}-${pointKey(e.to)}`}
               />)
            }
          </Layer>

          <Layer>
            {
              points.map(p => <Circle
                x={p.x}
                y={p.y}
                radius={config.pointRadius}
                fill={p === selectedPoint ? colorsConfig.selectedPoint : colorsConfig.point}
                key={`point-${pointKey(p)}`}
              />)
            }
          </Layer>
        </Stage>

        <div className="flex justify-between">

          <div className='justify-self-left'>
            {
              points.length > 1
              ? <button
                  className="inline-block bg-green-700 p-3 rounded-md hover:bg-green-800"
                  onClick={handleRunClick}
                >
                  Run Monotone subdivisions method
                </button>
              : <button
                  className="inline-block bg-green-900 p-3 rounded-md cursor-not-allowed"
                  onClick={handleRunClick}
                >
                  Run Monotone subdivisions method
                </button>
            }
            
          </div>

          <div className='justify-self-right'>
            <button
              className="inline-block bg-slate-300 p-3 rounded-md mr-4 hover:bg-slate-400"
              onClick={handleClearClick}
            >
              Clear
            </button>
            
            {
              selectedPoint || selectedEdge
              ? <button
                  className="inline-block bg-red-600 p-3 rounded-md hover:bg-red-700"
                  onClick={handleDeleteClick}
                >
                  X &nbsp;&nbsp;Delete &nbsp;&nbsp;X
                </button>
              : <button disabled className="inline-block bg-red-900 p-3 rounded-md cursor-not-allowed text-slate-900">X &nbsp;&nbsp;Delete &nbsp;&nbsp;X</button>
            }
          </div>

        </div>
    </div>
  );
}

export default App;
