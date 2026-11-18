"use client";
import {useEffect} from "react";
import {supabase} from "@/lib/supabase";
export function ArticleView({articleId}:{articleId:string}){useEffect(()=>{if(supabase)void supabase.functions.invoke("article-view",{body:{article_id:articleId}})},[articleId]);return null}