import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { Box, CircularProgress, TextField } from "@mui/material";
import { Button, Grid, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import mockData from "./mockData";
import { checkCodeMeli, isNumeric } from "./utils/validators";
import styled from "@emotion/styled";

const StyledBox = styled(Box)({
  background: "#F4F4F4",
  borderRadius: "12px",
  padding: "20px",
  transition: "all 0.3s ease",
  transform: "translateY(-10px)",
});

const DonutMenu = () => {
  const svgRef = useRef(null);
  const groupRef = useRef(null);
  const tooltipRef = useRef(null);

  const [data, setData] = useState(null);
  const [activeLayer, setActiveLayer] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedChildItem, setSelectedChildItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nationalCode, setNationalCode] = useState("");
  const [nationalCodeError, setNationalCodeError] = useState("");
  const [searchClicked, setSearchClicked] = useState(false);
  const [width, setWidth] = useState(700);
  const [height, setHeight] = useState(700);

  const colorCircle = d3
    .scaleOrdinal()
    .domain(mockData.map((d) => d.value))
    .range(mockData.map((d) => d.color));

  const updateDimensions = useCallback(() => {
    const containerWidth =
      window.innerWidth < 700 ? window.innerWidth - 40 : 700;
    setWidth(containerWidth);
    setHeight(containerWidth);
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setData(mockData);
      setIsLoading(false);
    }, 1000);

    const fetchData = async () => {
      try {
        const response = await fetch("http://yourPath/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([]),
          signal: controller.signal,
        });
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
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("aria-label", "Interactive donut menu visualization")
      .style("background", "#F4F4F4");

    if (!groupRef.current) {
      groupRef.current = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    }

    if (!tooltipRef.current) {
      tooltipRef.current = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
        .style("color", "#000");
    }

    drawLayers();
  }, [
    data,
    activeLayer,
    selectedItem,
    selectedChildItem,
    isLoading,
    searchClicked,
    width,
    height,
  ]);

  const drawLayers = () => {
    const group = groupRef.current;
    group.selectAll(".arc-layer").remove();

    const layers = [
      {
        items: [{ label: "کد ملی", value: "center" }],
        innerRadius: 0,
        outerRadius: width * 0.1,
      },
      {
        items: data.map((item) => ({ ...item })),
        innerRadius: width * 0.12,
        outerRadius: width * 0.24,
      },
      {
        items: selectedItem?.children || [],
        innerRadius: width * 0.26,
        outerRadius: width * 0.38,
      },
    ];

    layers.forEach((layer, layerIndex) => {
      if (
        layerIndex > 2 ||
        (layerIndex === 1 && !searchClicked) ||
        (layerIndex === 2 && !selectedItem)
      )
        return;

      const arc = d3
        .arc()
        .innerRadius(layer.innerRadius)
        .outerRadius(layer.outerRadius)
        .cornerRadius(8);

      const pie = d3.pie().value(1).sort(null).padAngle(0.02);

      const arcs = group
        .selectAll(`.arc-${layerIndex}`)
        .data(pie(layer.items))
        .enter()
        .append("g")
        .attr("class", `arc-layer arc-${layerIndex}`)
        .attr("role", "group")
        .style("cursor", layerIndex !== 0 ? "pointer" : "default")
        .style("opacity", (d) => {
          if (layerIndex === 1 && selectedItem)
            return d.data.value === selectedItem.value ? 1 : 0.5;
          if (layerIndex === 2 && selectedChildItem)
            return d.data.value === selectedChildItem.value ? 1 : 0.5;
          return 0;
        });

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) =>
          layerIndex === 0 ? "#f5f5f5" : colorCircle(d.data.value)
        )
        .attr("stroke", "#fff")
        .attr("stroke-width", (d) => {
          if (
            layerIndex === 1 &&
            selectedItem &&
            d.data.value === selectedItem.value
          )
            return 4;
          if (
            layerIndex === 2 &&
            selectedChildItem &&
            d.data.value === selectedChildItem.value
          )
            return 4;
          return 2;
        })
        .attr("aria-label", (d) => d.data.label);

      arcs
        .transition()
        .delay((d, i) => i * 100)
        .duration(600)
        .style("opacity", (d) => {
          if (layerIndex === 1 && selectedItem)
            return d.data.value === selectedItem.value ? 1 : 0.5;
          if (layerIndex === 2 && selectedChildItem)
            return d.data.value === selectedChildItem.value ? 1 : 0.5;
          return 1;
        });

      arcs.each(function (d) {
        const centroid = arc.centroid(d);
        const g = d3
          .select(this)
          .append("g")
          .attr("transform", `translate(${centroid[0]}, ${centroid[1]})`);

        if (layerIndex === 0) {
          const imageY =
            searchClicked && nationalCode.trim() !== ""
              ? -width * 0.1464
              : -width * 0.1186;

          g.append("image")
            .attr("href", "/4.png")
            .attr("x", -width * 0.06)
            .attr("y", imageY)
            .attr("width", width * 0.12)
            .attr("height", width * 0.12)
            .attr("aria-label", "Center icon");

          if (searchClicked && nationalCode.trim() !== "") {
            g.append("text")
              .text(nationalCode)
              .attr("y", -width * 0.00005)
              .attr("text-anchor", "middle")
              .attr("fill", "#000")
              .style("font-size", `${width * 0.02}px`)
              .attr("aria-label", `National Code: ${nationalCode}`);

            g.append("foreignObject")
              .attr("x", -width * 0.015)
              .attr("y", width * 0.008)
              .attr("width", width * 0.03)
              .attr("height", width * 0.03)
              .attr("title", "بازگشت به جستجو")
              .append("xhtml:div")
              .style("width", "100%")
              .style("height", "100%")
              .style("display", "flex")
              .style("align-items", "center")
              .style("justify-content", "center")
              .style("color", "white")
              .style("font-size", `${width * 0.02}px`)
              .style("background", "#FF6B6B")
              .style("border-radius", "50%")
              .style("cursor", "pointer")
              .text("×")
              .on("click", resetSearch);
          }
        } else {
          let transform = "";
          if (layerIndex === 2) {
            switch (d.data.value) {
              case "ctr_transaction_count":
              case "risk_transaction_amount":
              case "top10_destination_accounts_count":
              case "top10_source_accounts_amount":
              case "top10_source_accounts_count":
              case "top10_destination_accounts_amount":
              case "related_legal_noniranian":
                transform = `translate(0, ${width * 0.0143})`; // 10px down
                break;
              case "subject_count":
              case "subject_amount":
                transform = `translate(0, ${width * 0.0286})`; // 20px down
                break;
              case "related_legal_iranian":
                transform = `translate(${width * -0.0214}, ${width * 0.0071})`; // 15px left, 5px down
                break;
              case "related_real_iranian":
                transform = `translate(${width * -0.0286}, ${width * 0.0143})`; // 20px left, 10px down
                break;
              default:
                transform = "";
            }
          }

          g
            .append("foreignObject")
            .attr("width", width * 0.1)
            .attr("height", width * 0.1)
            .attr("x", -width * 0.05)
            .attr("y", -width * 0.05)
            .attr("transform", transform)
            .append("xhtml:div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("color", "#000")
            .style("font-size", `${width * 0.013}px`).html(`
              <div class="material-icons" style="font-size: ${
                width * 0.026
              }px;">${d.data.icon || ""}</div>
              <div style="text-align: center;">${d.data.label}</div>
            `);
        }
      });

      if (layerIndex !== 0) {
        arcs
          .select("path")
          .on("mouseover", function (event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("transform", "scale(1.05)");
            tooltipRef.current
              .style("visibility", "visible")
              .html(d.data.label)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`);
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(200)
              .attr("transform", "scale(1)");
            tooltipRef.current.style("visibility", "hidden");
          });
      }

      arcs.on("click", (event, d) => handleClick(layerIndex, d.data));
    });
  };

  const handleClick = (layerIndex, item) => {
    if (layerIndex === 0) return;

    if (layerIndex === 1) {
      if (selectedItem && selectedItem.value === item.value) {
        setSelectedItem(null);
        setActiveLayer(1);
        setSelectedChildItem(null);
      } else if (item.children && item.children.length > 0) {
        setSelectedItem(item);
        setActiveLayer(2);
        setSelectedChildItem(null);
      } else if (item.children && item.children.length !== 1) {
        performAction(item.value);
      }
    }

    if (layerIndex === 2) {
      setSelectedChildItem(item);
      performAction(item.value);
    }
  };

  const performAction = (value) => {
    console.log(`Action triggered for: ${value}`);
  };

  const resetSearch = () => {
    setSearchClicked(false);
    setNationalCode("");
    setSelectedItem(null);
    setSelectedChildItem(null);
    setActiveLayer(0);
  };

  return (
    <StyledBox>
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
        <Box sx={{ position: "relative", width: "100%", height: width }}>
          <svg ref={svgRef}></svg>

          {!searchClicked && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -10%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                width: "80%",
                maxWidth: 300,
              }}
            >
              <TextField
                inputProps={{ maxLength: 10 }}
                onChange={(e) => {
                  const value = e.target.value;
                  const lastChar = value.slice(-1);

                  if (value && !isNumeric(lastChar)) {
                    setNationalCodeError("لطفاً فقط عدد وارد کنید");
                    return;
                  }

                  setNationalCode(value);

                  if (value.length === 10 && !checkCodeMeli(value)) {
                    setNationalCodeError("کد ملی نامعتبره");
                  } else {
                    setNationalCodeError("");
                  }
                }}
                label="کد ملی"
                variant="filled"
                error={!!nationalCodeError}
                value={nationalCode === -1 ? "" : nationalCode}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {nationalCodeError && (
                <span
                  style={{
                    color: "red",
                    fontSize: "10px",
                    marginBottom: "2px",
                  }}
                >
                  {nationalCodeError}
                </span>
              )}

              <Button
                disabled={
                  nationalCode.trim() === "" || nationalCodeError !== ""
                }
                onClick={() => {
                  setSearchClicked(true);
                  setActiveLayer(1);
                }}
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                fullWidth
              >
                جستجو
              </Button>
            </Box>
          )}
        </Box>
      )}
    </StyledBox>
  );
};

export default DonutMenu;
