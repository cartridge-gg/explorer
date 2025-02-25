import React from "react";
import { useParams } from "react-router-dom";

export default function ClassHashDetails() {
  const { classHash } = useParams();
  return <div>ClassHashDetails</div>;
}
