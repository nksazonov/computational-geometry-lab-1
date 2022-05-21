import React, { useState } from 'react';
import { Layer, Stage } from 'react-konva';
import config from './config';
import {Chain, Edge, Point, Segment} from './types/geometry';
import {
  hasAdjacentSegment,
  nearestPoint as getNearestPoint,
  nearestSegment as getNearestEdge,
} from './algorithms/point-locations';
import { locatePoint, pointKey } from './algorithms/monotone_subdivisions';
import { transformChains, transformEdges, transformPoint, transformPoints } from './algorithms/transform';
import Chains from './components/Chains';
import Edges from './components/Edges';
import Points from './components/Points';

function App() {
  const [points, setPoints] = useState([] as Point[]);
  const [edges, setEdges] = useState([] as Edge[]);
  const [chains, setChains] = useState([] as Chain[]);
  const [selectedPoint, setSelectedPoint] = useState(null as Point | null);
  const [selectedEdge, setSelectedEdge] = useState(null as Segment | null);

  const [savedPoints, savePoints] = useState([] as Point[]);
  const [savedEdges, saveEdges] = useState([] as Edge[]);

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
          setEdges([...edges, {from: selectedPoint, to: clickedPoint, value: 1}]);
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
          // if selected is not the same as nearest AND edge is not already present - create edge to it
          if (!edges.includes({from: selectedPoint, to: nearestPoint, value: 1}) &&
          !edges.includes({from: nearestPoint, to: selectedPoint, value: 1})) {
            setEdges([...edges, {from: selectedPoint, to: nearestPoint, value: 1}]);
            setSelectedPoint(null);
          }
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
    setChains([]);
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
    if (selectedPoint === null) {
      return;
    }

    const result = locatePoint(
      transformPoint(selectedPoint),
      transformPoints(points.filter((p) => pointKey(p) !== pointKey(selectedPoint))),
      transformEdges(edges)
    );

    setEdges(transformEdges(result.edges));

    setChains(transformChains(
      result.betweenChains
    ));
  }

  const handleSaveClick = () => {
    savePoints(points);
    saveEdges(edges);
  }
  
  const handleLoadClick = () => {
    setPoints(savedPoints);
    setEdges(savedEdges);
  }

  const handleClearChainsClick = () => {
    setChains([]);
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
            <Edges
              edges={edges}
              selectedEdge={selectedEdge}
            />
            <Chains
              chains={chains}
              selectedEdge={selectedEdge}
            />
          </Layer>
          
          <Layer>
            <Points
              points={points}
              selectedPoint={selectedPoint}
            />
          </Layer>
        </Stage>

        <div className="flex justify-between">

          <div className='justify-self-left'>
            {
              points.length > 1 && selectedPoint && !hasAdjacentSegment(selectedPoint, edges)
              ? <button
                  className="inline-block bg-green-700 p-3 rounded-md hover:bg-green-800"
                  onClick={handleRunClick}
                >
                  Run Monotone subdivisions method
                </button>
              : <button
                  className="inline-block bg-green-900 p-3 rounded-md cursor-not-allowed"
                >
                  Run Monotone subdivisions method
                </button>
            }
            
          </div>

          <div className='justify-self-right'>
            {
              points.length === 0
              ? <button
                  className="inline-block bg-green-900 p-3 rounded-md mr-4 cursor-not-allowed"
                >
                  \/ Save graph \/
                </button>
              : <button
                  className="inline-block bg-green-700 p-3 rounded-md mr-4 hover:bg-green-800"
                  onClick={handleSaveClick}
                >
                  \/ Save graph \/
                </button>
            }


            {
              savedPoints.length === 0
              ? <button
                  className="inline-block bg-green-900 p-3 rounded-md mr-4 cursor-not-allowed"
                >
                  /\ Load saved graph /\
                </button>
              : <button
                  className="inline-block bg-green-700 p-3 rounded-md mr-4 hover:bg-green-800"
                  onClick={handleLoadClick}
                >
                  /\ Load saved graph /\
                </button>
            }

            <button
              className="inline-block bg-slate-300 p-3 rounded-md mr-4 hover:bg-slate-400"
              onClick={handleClearClick}
            >
              Clear
            </button>

            {
              chains.length === 0
              ? <button
                  className="inline-block bg-yellow-800 p-3 rounded-md mr-4 cursor-not-allowed"
                >
                  Clear chains
                </button>
            : <button
                className="inline-block bg-yellow-400 p-3 rounded-md mr-4 hover:bg-yellow-500"
                onClick={handleClearChainsClick}
              >
                Clear chains
              </button>
            }
            
            {
              selectedPoint || selectedEdge
              ? <button
                  className="inline-block bg-red-600 p-3 rounded-md hover:bg-red-700"
                  onClick={handleDeleteClick}
                >
                  X &nbsp;&nbsp;Delete&nbsp;&nbsp; X
                </button>
              : <button disabled className="inline-block bg-red-900 p-3 rounded-md cursor-not-allowed text-slate-900">
                  X &nbsp;&nbsp;Delete&nbsp;&nbsp; X
                </button>
            }
          </div>

        </div>
    </div>
  );
}

export default App;
