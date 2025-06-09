import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Box, CircularProgress } from "@mui/material";
import mockData from "./mockData";


const DonutMenu = () => {
  const svgRef = useRef(null);
  const groupRef = useRef(null);

  const [data, setData] = useState(null);
  const [activeLayer, setActiveLayer] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const width = 450;
  const height = 450;

  const colorCircle = d3
    .scaleOrdinal()
    .domain([0, 1, 2])
    .range(["transparent", "rgba(102,100,112,0.6)", "rgba(102,100,112,0.6)"]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setData(mockData);
      setIsLoading(false);
    }, 10000);

    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://188.121.115.30:9030/dml/v1/sima7/fraud-graph/transaction/report",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([]),
            signal: controller.signal,
          }
        );
        const result = await response.json();
        setData(mockData);
      } catch (error) {
        setData(mockData);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!data || isLoading) return;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    if (!groupRef.current) {
      groupRef.current = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    }

    drawLayers();
  }, [data, activeLayer, selectedItem, isLoading]);

  const drawLayers = () => {
    const group = groupRef.current;

    group.selectAll(".arc-layer").remove();

    const layers = [
      {
        items: [{ label: "کد ملی", value: "center" }],
        innerRadius: 0,
        outerRadius: 60,
      },
      {
        items: data.map((item) => ({ ...item })),
        innerRadius: 70,
        outerRadius: 140,
      },
    ];

    if (
      selectedItem &&
      selectedItem.children &&
      selectedItem.children.length > 0
    ) {
      layers.push({
        items: selectedItem.children,
        innerRadius: 150,
        outerRadius: 220,
      });
    }

    layers.forEach((layer, layerIndex) => {
      if (layerIndex > activeLayer) return;

      const arc = d3
        .arc()
        .innerRadius(layer.innerRadius)
        .outerRadius(layer.outerRadius);

      const pie = d3.pie().value(1).sort(null).padAngle(0.02);

      if (layerIndex === 0) {
        pie.startAngle(0).endAngle(2 * Math.PI);
      } else if (layerIndex === 1) {
        pie.startAngle((270 * Math.PI) / 180).endAngle((630 * Math.PI) / 180);
      } else {
        pie.startAngle((270 * Math.PI) / 180).endAngle((540 * Math.PI) / 180);
      }

      const arcs = group
        .selectAll(`.arc-${layerIndex}`)
        .data(pie(layer.items))
        .enter()
        .append("g")
        .attr("class", `arc-layer arc-${layerIndex}`)
        .style("cursor", layerIndex !== 0 ? "pointer" : "default")
        .style("opacity", 0);

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", colorCircle(layerIndex))
        .attr("stroke", "#1E1E1E")
        .attr("stroke-width", 0);

      arcs
        .transition()
        .delay((d, i) => i * 100)
        .duration(600)
        .style("opacity", 1);

      arcs.each(function (d) {
        const centroid = arc.centroid(d);
        const g = d3
          .select(this)
          .append("g")
          .attr("transform", `translate(${centroid[0]}, ${centroid[1]})`);

        const isCenter = layerIndex === 0;

        if (isCenter) {
          g.append("image")
            .attr("href", "/4.png")
            .attr("x", -28)
            .attr("y", -70)
            .attr("width", 60)
            .attr("height", 60);
          // .attr("clip-path", "circle(20px at 20px 20px)");

          g.append("text")
            .attr("y", 7)
            .attr("text-anchor", "middle")
            .attr("fill", "#000")
            .attr("font-size", "14px")
            .text("کد ملی");
        } else {
          g
            .append("foreignObject")
            .attr("width", 60)
            .attr("height", 60)
            .attr("x", -30)
            .attr("y", -30)
            .append("xhtml:div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("color", "white")
            .style("font-size", "10px").html(`
              <div class="material-icons" style="font-size: 18px;">${
                d.data.icon || ""
              }</div>
              <div>${d.data.label}</div>
            `);
        }
      });

      if (layerIndex !== 0) {
        arcs
          .select("path")
          .on("mouseover", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("transform", "scale(1.05) translate(10, -10)");
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("transform", "scale(1) translate(0, 0)");
          });
      }

      arcs.on("click", (event, d) => handleClick(layerIndex, d.data));
    });
  };

  const handleClick = (layerIndex, item) => {
    if (layerIndex === 0) {
      if (activeLayer > 0) {
        setActiveLayer(0);
        setSelectedItem(null);
      } else {
        setActiveLayer(1);
      }
      return;
    }

    if (layerIndex === 1) {
      if (selectedItem && selectedItem.value === item.value) {
        setSelectedItem(null);
        setActiveLayer(1);
      } else if (item.children && item.children.length > 0) {
        setSelectedItem(item);
        setActiveLayer(2);
      } else {
        performAction(item.value);
      }
    }

    if (layerIndex === 2) {
      performAction(item.value);
    }
  };

  const performAction = (value) => {
    console.log(`Action triggered for: ${value}`);
  };

  return (
    <Box
      sx={{
        width: 450,
        height: 450,
        overflow: "hidden",
        position: "relative",
        mx: "auto",
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <svg ref={svgRef}></svg>
      )}
    </Box>
  );
};

export default DonutMenu;
