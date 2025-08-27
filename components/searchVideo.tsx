"use client";

import { useRef, useState } from "react";
import axios from "axios";

const SAMPLE_VIDEOS_URLS = [
  {
    id: 12,
    created_at: "2025-08-26T20:29:36.219812+00:00",
    twelve_labs_video_id: "68ae192d88cce82e52610cc5",
    video_url:
      "https://res.cloudinary.com/dnqfxuxsm/video/upload/v1756240171/snoolink-studio/t46zz6t4ayhlw4iit6wy.mov",
    start: 2,
    end: 7,
  },
  {
    id: 17,
    created_at: "2025-08-26T20:29:45.104983+00:00",
    twelve_labs_video_id: "68ae19360f9a6d08004e5fdd",
    video_url:
      "https://res.cloudinary.com/dnqfxuxsm/video/upload/v1756240178/snoolink-studio/xdlweewhwl70dmv4yqp3.mov",
    start: 0,
    end: 4,
  },
];
const SAMPLE_SEARCH_VIDEOS = [
  {
    score: 77.25,
    start: 0,
    end: 7,
    video_id: "68ae192d88cce82e52610cc5",
    confidence: "medium",
    thumbnail_url:
      "https://prod-tl-emc-destination.s3.us-west-2.amazonaws.com/68ae1152cc3c33ad01a0677a/68ae192d88cce82e52610cc5/thumbnails/0.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Checksum-Mode=ENABLED&X-Amz-Credential=AKIAYRWJPOVHYLEFYCWJ%2F20250826%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250826T205058Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=eee7f717a9deaea05c7ec789dd28337e6c1a3359d6f4d4687076ef68bb0408fa",
    transcription: " Cool.",
  },
  {
    score: 69.68,
    start: 0,
    end: 4,
    video_id: "68ae19360f9a6d08004e5fdd",
    confidence: "low",
    thumbnail_url:
      "https://prod-tl-emc-destination.s3.us-west-2.amazonaws.com/68ae1152cc3c33ad01a0677a/68ae19360f9a6d08004e5fdd/thumbnails/0.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Checksum-Mode=ENABLED&X-Amz-Credential=AKIAYRWJPOVHYLEFYCWJ%2F20250826%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250826T205058Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=95a9f4b7068ff27f12635b9c0f53aa6c84129191c12640ec2966eaaecb4e2509",
    transcription: " you",
  },
];

const SearchVideo = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<
    Array<{
      id: number;
      created_at: string;
      twelve_labs_video_id: string;
      video_url: string;
      start: number;
      end: number;
    }>
  >([]);

  async function getVideosByIds(
    videoIds: Array<{
      video_id: string;
      start: number;
      end: number;
    }>
  ) {
    return SAMPLE_VIDEOS_URLS;

    const videoIdsArray = videoIds
      .map((video) => video.video_id)
      .join(",")
      .replaceAll("[", "")
      .replaceAll("]", "");

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supabase/get-videos`,
        {
          params: {
            videoIds: videoIdsArray,
          },
          maxRedirects: 5, // axios follows redirects automatically
        }
      );

      return response.data.map((video: {
        id: number;
        created_at: string;
        twelve_labs_video_id: string;
        video_url: string;
        start: number;
        end: number;
      }) => ({
        ...video,
        start: videoIds.find((v) => v.video_id === video.twelve_labs_video_id)
          ?.start,
        end: videoIds.find((v) => v.video_id === video.twelve_labs_video_id)
          ?.end,
      }));
    } catch (error) {
      console.error("Axios error:", error);
    }
  }

  async function searchVideos(searchQuery: string) {
    return SAMPLE_SEARCH_VIDEOS;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search`,
        {
          query: searchQuery,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const {
        data: { data: videos },
      } = response.data;

      return videos;
    } catch (error) {
      console.error("Axios error:", error);
    }
  }

  const handleSearch = async () => {
    const searchQuery = inputRef.current?.value;

    if (!searchQuery) {
      alert("Please enter a search query");
      return;
    }

    const videos = await searchVideos(searchQuery);
    const videosByIds = await getVideosByIds(
      videos.map((video: {
        video_id: string;
        start: number;
        end: number;
      }) => ({
        video_id: video.video_id,
        start: video.start,
        end: video.end,
      }))
    );

    setVideos(videosByIds);
  };

  return (
    <div className="flex flex-col gap-8  w-full h-full min-h-60">
      <div className="flex gap-8 w-full justify-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search video"
          className="border-2 border-gray-300 rounded-md p-2 overflow-clip w-1/2"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white rounded-md p-2"
        >
          Search
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 w-2/3 mx-auto">
        {videos.map((video) => (
          <video
            className="aspect-auto object-cover rounded-sm"
            key={video.id}
            src={`${video.video_url}#t=${video.start},${video.end}`}
            preload="metadata"
            muted
            controls
          />
        ))}
      </div>
    </div>
  );
};

export default SearchVideo;
