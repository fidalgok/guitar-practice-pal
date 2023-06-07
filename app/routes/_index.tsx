import { V2_MetaFunction, LoaderArgs, ActionArgs, redirect, json } from "@remix-run/node";
import * as z from 'zod'
import classnames from 'classnames'
import {
  useLoaderData, Form, Link, useNavigation, useSearchParams, isRouteErrorResponse,
  useRouteError,
  useFetcher,
  FetcherWithComponents,
} from "@remix-run/react";
import { VideoCameraIcon, PlayIcon, PauseIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, ArrowPathIcon, AdjustmentsHorizontalIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useRef, useEffect, useState, useId } from "react";
import * as Popover from '@radix-ui/react-popover';


export const meta: V2_MetaFunction = () => {
  return [
    { title: "Practice Pal" },
    { name: "description", content: "Loop YouTube, practice scales and intervals, find new chord progressions, and more." },
  ];
};




export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const videoUrl = url.searchParams.get("videoUrl");
  const videoID = videoUrl ? extractVideoID(videoUrl) : null;
  const startTime = parseTime(url.searchParams.get("startTime") || "00");
  const endTime = parseTime(url.searchParams.get("endTime") || "00");
  const loop = url.searchParams.get("loop");
  const speed = url.searchParams.get("speed");

  function extractVideoID(url: string) {
    // Regular Expression to check if the URL is a valid YouTube URL
    let pattern = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|user\/[^\/]+\/u\/[^\/]+\/)|youtu\.be\/)?([^&?\/]{11})/;
    let match = url.match(pattern);

    // If URL doesn't match the YouTube URL pattern, throw an error
    if (!match || match[1] === undefined) {
      throw new Error("Invalid YouTube URL");
    }

    let videoID = match[1];
    const ampersandPosition = videoID.indexOf("&");
    if (ampersandPosition !== -1) {
      videoID = videoID.substring(0, ampersandPosition);
    }
    return videoID;
  }

  return { videoID, startTime, endTime, loop, speed };
}

function parseTime(time: string): number {
  const timeParts = time.split(':').reverse();

  if (timeParts.length > 3 || timeParts.length < 1) {
    throw new Error('Invalid time format. Please use one of the formats: hh:mm:ss, mm:ss, ss');
  }

  const [seconds, minutes = 0, hours = 0] = timeParts.map(part => {
    const num = parseInt(part, 10);
    if (isNaN(num)) {
      throw new Error('Invalid time format. Please use numbers in your format: hh:mm:ss, mm:ss, ss');
    }
    return num;
  });

  return hours * 3600 + minutes * 60 + seconds;
}

function VideoPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-200 text-gray-700 p-8 rounded-lg w-[560px] h-[315px]">
      <VideoCameraIcon className="w-20 h-20 mb-4" />
      <h2 className="mt-4 text-xl text-center">Enter a YouTube URL to display the video</h2>
    </div>
  );
}

let player: YT.Player;

let onYouTubeIframeAPIReady: () => void;

function onPlayerReady(event: YT.PlayerEvent) {

  //console.log('player ready')
  event.target.playVideo()
  //console.log('player playback rates', event.target.getAvailablePlaybackRates())

}

function onPlayerError(event: YT.OnErrorEvent) {
  console.log('player error');
  console.log(event.data)
}

function getPlaybackSpeeds(speeds?: number[]) {
  if (speeds?.length) {
    return speeds;
  } else {
    return [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  }
}

function createPlaybackSpeedOption(speed: number) {
  const id = useId()
  return (
    <option key={id} value={speed}>{speed}x</option>
  )
}



export default function Index() {
  let { videoID, startTime, endTime, loop, speed } = useLoaderData<typeof loader>();
  let [searchParams, setSearchParams] = useSearchParams();


  let settingsFetcher = useFetcher();

  let intervalIdRef = useRef<number | null>(null)
  let videoURL = searchParams.get("videoUrl") || "";
  let videoStartTime = searchParams.get("startTime") || "";
  let videoEndTime = searchParams.get("endTime") || "";
  let playerContainerRef = useRef<HTMLDivElement>(null)
  let playerRef = useRef<YT.Player | null>(null);
  let playbackSpeeds = getPlaybackSpeeds();
  let navigation = useNavigation();
  let selectedSpeed = speed || "1";

  if (settingsFetcher.formData) {
    console.log(settingsFetcher.formData.values())
    console.log(settingsFetcher.data)
  }

  function checkVideoTime() {
    // console.log({ currentTime: player.getCurrentTime(), loop, endTime })
    if (player) {
      if (endTime && player.getCurrentTime() >= endTime && loop) {
        player.seekTo(startTime, true);
        player.playVideo();
      }
    }

  }

  function onPlayerStateChange(event: YT.PlayerEvent) {
    //console.log('player state change', event.target.getPlayerState())
    player.setPlaybackRate(parseFloat(speed || '1'))
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    let currentPlayer = event.target;


    if (currentPlayer.getPlayerState() === 1 && loop === 'on') {

      // create an interval to see if the end time is greater than the current time. If so,
      // seek to start and play again while the loop checkbox is selected.
      intervalIdRef.current = window.setInterval(checkVideoTime, 500)
    }

    if (event.target.getPlayerState() === 0 && loop === 'on') {
      event.target.seekTo(startTime, true);
      event.target.playVideo();

    }

  }
  function initializePlayer() {
    if (videoID) {
      // this doesn't run on a blank page. Need to initialize the player after form submissions too.
      console.log('have a video id, initialize the player')
      // ok the page is loaded, determin the player size based on the width of the parent container
      // and the aspect ratio of the video.
      let playerContainer = playerContainerRef.current;
      let playerWidth = playerContainer?.clientWidth || 325;
      let playerHeight = playerWidth * 0.5625;
      console.log(playerWidth, playerHeight)
      player = new YT.Player('player', {
        videoId: videoID,
        playerVars: {
          start: startTime > 0 ? startTime : 0,
          autoplay: 0,
          controls: 0,
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onError': onPlayerError
        }
      });
      player.setSize(playerWidth, playerHeight);
      playerRef.current = player;
    }
  }
  function handleYouTubePlayerReady() {
    console.log('iFrame API is ready, create the player.')
    initializePlayer();
  }
  useEffect(() => {
    onYouTubeIframeAPIReady = handleYouTubePlayerReady
    if (!player) {

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      if (window) {
        window.onYouTubeIframeAPIReady = handleYouTubePlayerReady

      }
      // before adding the youtube api script see if it exists first
      let existingScript = [...document.getElementsByTagName('script')].find(s => s.src === tag.src)
      if (!existingScript) {

        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

    } else if (player && videoID) {

      player.loadVideoById({ videoId: videoID, startSeconds: startTime });
      player.addEventListener('onStateChange', onPlayerStateChange)
      player.setPlaybackRate(parseFloat(speed || '1'))
      playerRef.current = player;

    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    }
  }, [videoID, startTime, endTime, loop, speed]);

  useEffect(() => {
    console.log(navigation.state)

    if (navigation.state === 'idle') {
      if (!player && videoID && window.YT) {
        initializePlayer();

      }
    }
  }
  )

  return (
    <div className="grid lg:grid-cols-[225px_1fr] grid-cols-1 gap-4">
      <header className="bg-slate-50 w-full lg:w-112  lg:overflow-y-auto xl:w-120 py-3 px-4">
        {/* Mobile */}
        <div className="lg:hidden">


          <Popover.Root>
            <Popover.Trigger asChild>
              <button>

                <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-500 cursor-pointer" />
              </button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content sideOffset={5} className="bg-white w-full p-4 rounded-md shadow-sm focus:shadow-md will-change-[transform,opacity] slideDownAndFade data-[state=open]:animate-slideUpAndFade">
                <div >


                  <settingsFetcher.Form method="post" action="/" className="w-full ">
                    <input type="hidden" name="videoUrl" value={videoURL} />
                    <FieldWrap label="Start time">
                      {(id) => (
                        <input id={id} name="startTime" type="text" className="rounded-md border-2 border-slate-300 px-2 py-3 focus:border-slate-300 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultValue={videoStartTime} />
                      )}
                    </FieldWrap>
                    <FieldWrap label="End time">
                      {(id) => (
                        <input id={id} name="endTime" type="text" className="rounded-md border-2 border-slate-300 px-2 py-3 focus:border-slate-300 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultValue={videoEndTime} />
                      )}
                    </FieldWrap>
                    <FieldWrap label="Loop">
                      {(id) => (
                        <input id={id} name="loop" type="checkbox" className="rounded bg-gray-200 border-transparent p-3 focus:border-transparent focus:bg-gray-200 text-gray-700 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultChecked={loop === 'on'} />
                      )}</FieldWrap>
                    <FieldWrap label="Speed">
                      {(id) => (
                        // a dropdown with options for playback speed
                        <select id={id} name="speed" className="rounded border-slate-300 text-gray-700 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500 focus:border-slate-300" defaultValue={selectedSpeed}>
                          {playbackSpeeds.map(speed => createPlaybackSpeedOption(speed))}

                        </select>
                      )}
                    </FieldWrap>
                    <button type="submit" className="group inline-flex justify-center rounded-lg text-sm font-semibold mt-3 py-3 px-4 bg-slate-900 text-white hover:bg-slate-700"><span className="group">Submit<span aria-hidden="true"></span></span></button>
                  </settingsFetcher.Form>
                </div>
                <Popover.Close className="absolute top-0 right-0 mt-3 mr-3">
                  <button>
                    <XCircleIcon className="w-6 h-6 text-gray-800 cursor-pointer" />
                  </button>
                </Popover.Close>
              </Popover.Content>

            </Popover.Portal>
          </Popover.Root></div>
        {/* Desktop */}
        <settingsFetcher.Form method="post" action="/" className="w-full hidden lg:block">
          <input type="hidden" name="videoUrl" value={videoURL} />
          <FieldWrap label="Start time">
            {(id) => (
              <input id={id} name="startTime" type="text" className="rounded-md border-2 border-slate-300 px-2 py-3 focus:border-slate-300 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultValue={videoStartTime} />
            )}
          </FieldWrap>
          <FieldWrap label="End time">
            {(id) => (
              <input id={id} name="endTime" type="text" className="rounded-md border-2 border-slate-300 px-2 py-3 focus:border-slate-300 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultValue={videoEndTime} />
            )}
          </FieldWrap>
          <FieldWrap label="Loop">
            {(id) => (
              <input id={id} name="loop" type="checkbox" className="rounded bg-gray-200 border-transparent p-3 focus:border-transparent focus:bg-gray-200 text-gray-700 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultChecked={loop === 'on'} />
            )}</FieldWrap>
          <FieldWrap label="Speed">
            {(id) => (
              // a dropdown with options for playback speed
              <select id={id} name="speed" className="rounded border-slate-300 text-gray-700 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500 focus:border-slate-300" defaultValue={selectedSpeed}>
                {playbackSpeeds.map(speed => createPlaybackSpeedOption(speed))}

              </select>
            )}
          </FieldWrap>
          <button type="submit" className="group inline-flex justify-center rounded-lg text-sm font-semibold mt-3 py-3 px-4 bg-slate-900 text-white hover:bg-slate-700"><span className="group">Submit<span aria-hidden="true"></span></span></button>
        </settingsFetcher.Form>
      </header>

      <div className="flex flex-col items-center min-h-screen py-3 px-4">
        <h1 className="text-4xl font-bold mb-8">Welcome to PracticeTube</h1>
        <Form action="/" method="GET" className="mb-8 flex gap-3 flex-col w-full md:flex-row md:items-center md:justify-center">


          <FieldWrap label={`${videoID ? 'Update' : 'Find a'} YouTube Video`} required>
            {(id) => (
              <input id={id} name="videoUrl" type="text" className="rounded-md w-full md:w-96 border-2 border-slate-300 px-2 py-3 mr-2 focus:border-slate-300 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500" defaultValue={videoURL} />

            )}
          </FieldWrap>



          <button type="submit" className="group md:place-self-end inline-flex justify-center rounded-lg text-sm font-semibold  py-4 px-4 mb-3 md:mb-0 bg-slate-900 text-white hover:bg-slate-700"><span className="group">{`${videoID ? 'Update Video' : 'Find Video'}`}<span aria-hidden="true" className="group-hover:translate-x-1 transition ease-in-out delay-150 duration-300 ml-1 text-slate-400 inline-block">→</span></span></button>
        </Form>

        {videoID ? (
          <div ref={playerContainerRef} className="grid grid-cols-1 grid-rows-2 w-full md:max-w-[768px]">
            <div id="player" className="w-full"></div>
            <div className="mt-2">
              <Timeline player={playerRef} settingsFetcher={settingsFetcher} />
            </div>
          </div>
        ) : (
          <VideoPlaceholder />
        )}
      </div>
    </div>
  );
}
type FieldWrapProps = {
  children: (id: string) => React.ReactNode
  label: string
  required?: boolean
}

export function FieldWrap({ children, label, required = false }: FieldWrapProps) {
  const id = useId()
  return (
    <div className={classnames('form-field-wrap mb-4 md:mb-0 flex flex-col items-start gap-y-3 w-full md:flex-initial md:w-max', { required })}>
      <label htmlFor={id} className="text-lg">
        {label}
      </label>
      <div className="flex flex-grow flex-col space-y-1 w-full">{children(id)}</div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
interface TimelineProps {
  player: React.MutableRefObject<YT.Player | null>
  settingsFetcher: FetcherWithComponents<any>
}
function Timeline({ player, settingsFetcher }: TimelineProps) {
  const [percentage, setPercentage] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  let [searchParams] = useSearchParams();

  function replaceSearchParam(param: string, value: string) {
    // will replace the  search param from the url with the given param and value pair
    //create a new search Params object based on the current params
    let newSearchParams = new URLSearchParams(searchParams.toString());
    // delete the param from the new search params object
    newSearchParams.delete(param);
    // append the new param and value to the new search params object
    newSearchParams.append(param, value);
    // return the new search params object as a string
    return newSearchParams.toString();
  }

  useInterval(() => {
    const currentPlayer = player.current;
    const playing = currentPlayer?.getPlayerState() === 1;
    const currentTime = currentPlayer?.getCurrentTime() || 0
    const duration = currentPlayer?.getDuration() || 0
    console.log(`tick: Playing = ${isPlaying}`)
    if (duration > 0) {
      setPercentage(currentTime / duration * 100);
      setCurrentTime(Math.round(currentTime));
      setPlayerDuration(Math.round(duration));
    }

    if (playing !== isPlaying) {
      // don't need unnecessary re-renders only need to change the state if they're different.
      setIsPlaying(playing);
    }
  }, isPointerDown ? null : 1000)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement> | PointerEvent | React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    console.log('pointer down')
    let clientX: number;
    if (e instanceof PointerEvent || e.type === 'pointerdown') {
      timelineRef.current?.setPointerCapture((e as PointerEvent).pointerId)
      clientX = (e as PointerEvent).clientX;
    } else if (e instanceof TouchEvent || e.type === 'touchstart') {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
    } else {
      // this should never happen
      console.log('here?')

      return;
    }
    updateTimeline(clientX);
    setIsPointerDown(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement> | PointerEvent | React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    console.log('moving pointer', isPointerDown)
    let clientX: number;
    if (e instanceof PointerEvent || e.type === 'pointermove') {

      clientX = (e as PointerEvent).clientX;
    } else if (e instanceof TouchEvent || e.type === 'touchmove') {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
    } else {
      // this should never happen
      console.log('here?')

      return;
    }
    if (isPointerDown)
      updateTimeline(clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement> | PointerEvent | React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    let clientX: number;
    if (e instanceof PointerEvent || e.type === 'pointerup') {

      clientX = (e as PointerEvent).clientX;
    } else if (e instanceof TouchEvent || e.type === 'touchend') {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
    } else {
      // this should never happen
      console.log('here?')

      return;
    }
    updateTimeline(clientX, true);
    setIsPointerDown(false);
    console.log('removing pointer events')
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

  };



  const updateTimeline = (clientX: number, seekTo?: boolean) => {
    const rect = timelineRef?.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = clientX - rect.left;
    const percentage = x / rect.width * 100;

    // Clamp the percentage between 0 and 100
    const clampedPercentage = Math.max(0, Math.min(percentage, 100));

    // Update the video time based on the new percentage
    if (player.current) {
      const currentPlayer = player.current;
      const newTime = clampedPercentage / 100 * currentPlayer.getDuration();
      if (seekTo)
        currentPlayer.seekTo(newTime, true);
    }

    setPercentage(clampedPercentage);
  };

  return (
    <div>

      {/* The timeline bar  */}
      <div
        className="relative w-full h-2 bg-gray-300 rounded-lg mb-3 "
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Video progress"
        ref={timelineRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}

      >
        <div
          className="absolute top-0 left-0 h-2 bg-gray-700 rounded-l-lg"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute -mt-[2px] top-0 h-3 w-2 bg-gray-700 cursor-pointer"
          style={{ left: `${percentage}%` }}
        />
      </div>
      {/* The timeline controls */}
      <div className="flex items-center w-full gap-3 flex-wrap">

        <button type="button" aria-label="Play/Pause" className="group relative flex flex-shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-900 focus:outline-none focus:ring-slate-700 h-14 w-14 focus:ring-2 focus:ring-offset-2" onClick={() => {
          const currentPlayer = player.current;
          if (currentPlayer) {
            if (isPlaying)
              currentPlayer.pauseVideo();
            else
              currentPlayer.playVideo();
            setIsPlaying(!isPlaying);
          }
        }}>
          {isPlaying ? (
            <PauseIcon className="h-6 w-6 text-white" />
          ) : (
            <PlayIcon className="h-6 w-6 text-white" />
          )}
        </button>
        <div>
          <p>
            {secondsToHms(currentTime)} / {secondsToHms(playerDuration)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/?${replaceSearchParam('startTime', secondsToHms(currentTime))}`} className="group relative flex flex-shrink-0 items-center justify-center hover:underline-offset-1 hover:underline ">Set start of loop</Link>

          <Link to={`/?${replaceSearchParam('endTime', secondsToHms(currentTime))}`} className="group relative flex flex-shrink-0 items-center justify-center hover:underline-offset-1 hover:underline ">Set end of loop</Link>

          <Link to={`/?${replaceSearchParam('loop', 'on')}`} className="group relative flex flex-shrink-0 items-center justify-center hover:underline-offset-1 hover:underline ">Loop Video</Link>
        </div>
      </div>
    </div>
  );
}

function useInterval(callback: () => void, delay: number | null) {
  const intervalRef = useRef<number | null>(null);
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === 'number') {
      intervalRef.current = window.setInterval(tick, delay);
      return () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
        }
      }
    }
  }, [delay]);
  return intervalRef;
}

function secondsToHms(d: number): string {
  d = Number(d);
  const h = Math.floor(d / 3600);
  const m = Math.floor(d % 3600 / 60);
  const s = Math.floor(d % 3600 % 60);

  const hDisplay = h > 0 ? h + (h == 1 ? ":" : ":") : "";
  const mDisplay = m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "00:";
  const sDisplay = s > 0 ? (s < 10 ? "0" : "") + s : "00";
  return hDisplay + mDisplay + sDisplay;
}