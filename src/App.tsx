import React, { useState } from 'react';
import { Layer, Stage } from 'react-konva';

import config from './config';
import {Chain, Edge, Point, Segment} from './types/geometry';
import {
  hasAdjacentSegment,
  nearestPoint as getNearestPoint,
  nearestSegment as getNearestEdge,
  segmentsContain,
} from './algorithms/point-locations';
import { locatePoint, pointKey } from './algorithms/monotone-subdivisions';
import { resizeData, transformChains, transformEdges, transformPoint, transformPoints } from './algorithms/transform';
import Chains from './components/Chains';
import Edges from './components/Edges';
import Points from './components/Points';
import {IData} from './types/data';

function App() {
  const [points, setPoints] = useState([] as Point[]);
  const [edges, setEdges] = useState([] as Edge[]);
  const [selectedPoint, setSelectedPoint] = useState(null as Point | null);
  const [selectedEdge, setSelectedEdge] = useState(null as Segment | null);
  
  const [savedPoints, savePoints] = useState([] as Point[]);
  const [savedEdges, saveEdges] = useState([] as Edge[]);

  const [chains, setChains] = useState([] as Chain[]);
  const [enclosingChains, setEnclosingChains] = useState([] as Chain[]);
  const [displayedChains, setDisplayedChains] = useState(null as null | 'chains' | 'enclosingChains' | 'hidden');

  const stageWidth = window.innerWidth * config.canvasWidthMultiplier;
  const stageHeigth = window.innerHeight * config.canvasHeightMultiplier;

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
          if (!segmentsContain({from: selectedPoint, to: nearestPoint}, edges) ||
            !segmentsContain({from: nearestPoint, to: selectedPoint}, edges)) {
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
    setEnclosingChains([]);
    setDisplayedChains(null);
    setSelectedPoint(null);
    setSelectedEdge(null);
  }

  const handleDeleteClick = () => {
    if (selectedPoint) {
      setPoints([...points.filter(p => p !== selectedPoint)]);
      setEdges([...edges.filter(e => pointKey(e.from) !== pointKey(selectedPoint) && pointKey(e.to) !== pointKey(selectedPoint))]);
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
    setChains(transformChains(result.chains));
    setEnclosingChains(transformChains(result.enclosingChains));

    setDisplayedChains('enclosingChains');
  }

  const handleSaveClick = () => {
    savePoints(points);
    saveEdges(edges);

    console.log(JSON.stringify({screen: {width: stageWidth, heigth: stageHeigth}, points, edges}));
  }
  
  const handleLoadClick = () => {
    setPoints(savedPoints);
    setEdges(savedEdges);
  }

  const handleToggleChainsClick = () => {
    if (displayedChains === null) {
      return;
    }

    switch(displayedChains) {
      case 'hidden':
        setDisplayedChains('enclosingChains');
        break;

      case 'chains':
        setDisplayedChains('hidden')
        break;

      case 'enclosingChains':
        setDisplayedChains('chains');
        break;
    }
  }

  const getToggleChainsText = () => {
    switch(displayedChains) {
      case 'hidden':
        return 'Show enclosing chains';
      
      case 'chains':
        return 'Hide all chains';

      case 'enclosingChains':
        return 'Show all chains'
    } 
  }

  const handleLoadExampleClick = (num: number) => {
    setSelectedPoint(null);
    setSelectedEdge(null);
    setDisplayedChains(null);

    const data: IData = require(`./data/example${num}.json`);
    const resizedData = resizeData(data, {width: stageWidth, height: stageHeigth});

    setPoints(resizedData.points);
    setEdges(resizedData.edges);
  }

  return (
    <div className="w-screen h-screen bg-slate-700 p-4 border-box text-xs 2xl:text-base">
        <Stage
          width={stageWidth}
          height={stageHeigth}
          className="border-box bg-slate-800 rounded-3xl cursor-crosshair mb-4"
          onClick={handleStageClick}
        >
          <Layer>
            <Edges
              edges={edges}
              selectedEdge={selectedEdge}
            />

            {
              displayedChains && displayedChains !== 'hidden' && displayedChains === 'chains'
              ? <Chains
                  chains={chains}
                  selectedEdge={selectedEdge}
                />
              : displayedChains && displayedChains !== 'hidden' && displayedChains === 'enclosingChains'
                ? <Chains
                    chains={enclosingChains}
                    selectedEdge={selectedEdge}
                  />
                : null
            }
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
              points.length > 2 && selectedPoint && !hasAdjacentSegment(selectedPoint, edges)
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

            <button
              className="inline-block bg-blue-400 p-3 rounded-md mr-4 hover:bg-blue-500"
              onClick={() => handleLoadExampleClick(1)}
            >
              /\ Example 1 /\
            </button>

            <button
              className="inline-block bg-blue-400 p-3 rounded-md hover:bg-blue-500"
              onClick={() => handleLoadExampleClick(2)}
            >
              /\ Example 2 /\
            </button>

            <div
                className="inline-block h-4 w-0.5 bg-slate-500 mx-4">
            </div>

            {
              points.length === 0
              ? <button
                  className="inline-block bg-green-900 p-3 rounded-md mr-4 cursor-not-allowed"
                >
                  \/ Save \/
                </button>
              : <button
                  className="inline-block bg-green-700 p-3 rounded-md mr-4 hover:bg-green-800"
                  onClick={handleSaveClick}
                >
                  \/ Save \/
                </button>
            }


            {
              savedPoints.length === 0
              ? <button
                  className="inline-block bg-green-900 p-3 rounded-md cursor-not-allowed"
                >
                  /\ Load /\
                </button>
              : <button
                  className="inline-block bg-green-700 p-3 rounded-md hover:bg-green-800"
                  onClick={handleLoadClick}
                >
                  /\ Load /\
                </button>
            }

            <div
              className="inline-block h-4 w-0.5 bg-slate-500 mx-4">
            </div>

            {
              displayedChains === null
              ? <button
                  className="inline-block bg-zinc-800 p-3 rounded-md cursor-not-allowed"
                >
                  No chains to show
                </button>
              : <button
                  className="inline-block bg-zinc-400 p-3 rounded-md hover:bg-zinc-500"
                  onClick={handleToggleChainsClick}
                >
                  {getToggleChainsText()}
                </button>
            }

            <div
              className="inline-block h-4 w-0.5 bg-slate-500 mx-4">
            </div>

            <button
              className="inline-block bg-slate-300 p-3 rounded-md mr-4 hover:bg-slate-400"
              onClick={handleClearClick}
            >
              Clear all
            </button>

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
