"use client"

import { useEffect, useState } from "react"

interface S3ImageProps {
  s3Key: string
  alt: string
  className?: string
}

export function S3Image({ s3Key, alt, className }: S3ImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/upload/view?key=${encodeURIComponent(s3Key)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.url) setUrl(data.url)
          else setError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [s3Key])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-400 text-sm`}>
        Failed to load
      </div>
    )
  }

  if (!url) {
    return <div className={`${className} bg-gray-100 animate-pulse`} />
  }

  return <img src={url} alt={alt} className={className} />
}

export function S3Video({ s3Key, className }: { s3Key: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/upload/view?key=${encodeURIComponent(s3Key)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.url) setUrl(data.url)
      })
    return () => {
      cancelled = true
    }
  }, [s3Key])

  if (!url) return <div className={`${className} bg-gray-100 animate-pulse`} />
  return <video src={url} controls className={className} />
}
