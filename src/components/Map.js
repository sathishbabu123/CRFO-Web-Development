import React, { useState, useEffect } from "react";
import {
  Circle,
  Map,
  Marker,
  Popup,
  // Tooltip,
  TileLayer,
} from "react-leaflet";
import { readRemoteFile } from "react-papaparse";
import geoLocation from "../data/geoLocation.js";
import testCenters from "../data/testCenters.js";
import classNames from "classnames/bind";
const cx = classNames.bind(require("./map.module.css"));

let center = [9.5915668, 76.5221531];
const papaparseOptions = {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.toLowerCase().replace(/\W/g, "_"),
};

// to aggregate data by state+country and sum up metrics
const groupMetricsByStateAndCountry = (data) => {
  const internationalDataLookup = Array.isArray(data)
    ? data
        .filter((data) => data.lat && data.long_)
        .reduce((intLookup, data) => {
          const key = `${data.province_state}.${data.country_region}`;
          if (intLookup[key]) {
            intLookup[key] = {
              ...intLookup[key],
              deaths: intLookup[key].deaths + data.deaths,
              confirmed: intLookup[key].confirmed + data.confirmed,
              recovered: intLookup[key].recovered + data.recovered,
              active: intLookup[key].active + data.active,
            };
            return intLookup;
          }
          intLookup[key] = data;
          return intLookup;
        }, {})
    : {};
  return Object.keys(internationalDataLookup).map(
    (key) => internationalDataLookup[key]
  );
};
const PopupLineItem = ({ type, count, legend }) => {
  return (
    <>
      <div className={cx(["popup-legend", "legend-" + legend])}></div>
      <div className={cx("count-type")}>{type}</div>
      <div className={cx("counts")}>
        {count !== undefined && count !== null
          ? count.toLocaleString(navigator.language, {
              maximumFractionDigits: 2,
            })
          : ""}
      </div>
    </>
  );
};

export default function MapContainer(props) {
  const {
    onStateWiseDataGetSuccess,
    onDistrictWiseDataGetSuccess,
    viewTestCenters,
    selectedLocCoordinate,
  } = props;

  if (selectedLocCoordinate && selectedLocCoordinate.length) {
    center = [
      selectedLocCoordinate[0].latitude,
      selectedLocCoordinate[0].longitude,
    ];
  }
  const [indiaData, setIndiaData] = useState(null);

  const [stateData, setStateData] = useState(null);
  const [countrySummary, setCountrySummary] = useState(null);

  const [districtData, setDistrictData] = useState(null);

  const [internationalData, setInternationalData] = useState([]);
  const [countryStats, setCountryStats] = useState(null);
  const [worldStats, setWorldStats] = useState(null);

  // const [viewTestCenters, setViewTestCenters] = useState(false);
  const [showInfoHead, setShowInfoHead] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (countrySummary)
      if (indiaData.countryData)
        if (
          countrySummary.confirmedCasesIndian +
            countrySummary.confirmedCasesForeign >
          indiaData.countryData.total
        )
          setIndiaData(null);
  }, [stateData, indiaData]);
  useEffect(() => {
    console.log("Fetching Data");
    fetch("https://exec.clay.run/kunksed/mohfw-covid")
      .then((res) => res.json())
      .then(
        (result) => {
          // console.log("Received Response")
          setIndiaData(result);
        },
        (error) => {
          // console.log("Error Response")
        }
      );

    fetch("https://api.rootnet.in/covid19-in/stats/latest")
      .then((res) => res.json())
      .then(
        (result) => {
          console.log("Received Response" + result);
          onStateWiseDataGetSuccess
            ? onStateWiseDataGetSuccess(result.data)
            : (() => {})();
          setStateData(
            Object.assign(
              {},
              ...result.data.regional.map(
                ({
                  loc,
                  confirmedCasesIndian,
                  confirmedCasesForeign,
                  deaths,
                  discharged,
                }) => ({
                  [loc]: {
                    confirmedCasesIndian,
                    confirmedCasesForeign,
                    deaths,
                    discharged,
                  },
                })
              )
            )
          );

          setCountrySummary(result.data.summary);
        },
        (error) => {
          console.log("Error Response");
        }
      );

  }, []);
  console.log(viewTestCenters);

  const findRadius = (cases) => {
    return Math.cbrt(cases) * 1500;
  };
  return (
    <div className={"map-container"}>
      <Map center={center} zoom={7}>
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
        {indiaData && indiaData.stateData
          ? geoLocation.map((location) => {
              console.log(
                location.state +
                  "|" +
                  JSON.stringify(indiaData.stateData[location.state])
              );
              const locationData = indiaData.stateData[location.state];
              if (locationData.cases === 0 || location.state === "Kerala")
                return null;
              return (
                <Circle
                  key={location.state}
                  center={[location.latitude, location.longitude]}
                  fillColor="#d14f69"
                  fillOpacity={0.6}
                  stroke={false}
                  radius={15000 + findRadius(locationData.cases)}
                  onMouseOver={(e) => {
                    firstLoad && setFirstLoad(false);
                    e.target.openPopup();
                  }}
                >
                  <Popup>
                    <h3>{location.state}</h3>
                    <div className={cx("popup-line-wrap")}>
                      <PopupLineItem
                        legend="cases"
                        type="Cases"
                        count={locationData.cases}
                      />
                      <PopupLineItem
                        legend="cured"
                        type="Cured/Discharged"
                        count={locationData.cured_discharged}
                      />
                      <PopupLineItem
                        legend="death"
                        type="Deaths"
                        count={locationData.Deaths}
                      />
                      <hr />
                      Helpline: {locationData.helpline}
                    </div>
                  </Popup>
                </Circle>
              );
            })
          : stateData &&
            geoLocation.map((location) => {
              // console.log(location.state + "|" + JSON.stringify(indiaData.stateData[location.state]))
              const locationData = stateData[location.state];
              if (
                locationData === undefined ||
                (locationData.confirmedCasesIndian === 0 &&
                  locationData.confirmedCasesForeign === 0) ||
                location.state === "Kerala"
              )
                return null;
              return (
                <Circle
                  key={location.state}
                  center={[location.latitude, location.longitude]}
                  fillColor="#d14f69"
                  fillOpacity={0.6}
                  stroke={false}
                  radius={
                    15000 +
                    findRadius(
                      locationData.confirmedCasesIndian +
                        locationData.confirmedCasesForeign
                    )
                  }
                  onMouseOver={(e) => {
                    firstLoad && setFirstLoad(false);
                    e.target.openPopup();
                  }}
                >
                  {locationData.discharged ? (
                    <Circle
                      key={`discharged-${location.state}`}
                      center={[location.latitude, location.longitude]}
                      fillColor="#1df500"
                      fillOpacity={0.7}
                      stroke={false}
                      radius={400 + findRadius(locationData.discharged)}
                      onMouseOver={(e) => {
                        firstLoad && setFirstLoad(false);
                        e.target.openPopup();
                      }}
                    ></Circle>
                  ) : null}
                  {locationData.deaths ? (
                    <Circle
                      key={`deaths-${location.state}`}
                      center={[location.latitude, location.longitude]}
                      fillColor="#f55600"
                      fillOpacity={0.9}
                      stroke={false}
                      radius={findRadius(locationData.deaths) / 2}
                      onMouseOver={(e) => {
                        firstLoad && setFirstLoad(false);
                        e.target.openPopup();
                      }}
                    ></Circle>)
                    : null
                }
                <Popup>
                  <h3>{location.state}</h3>
                  <div className={cx("popup-line-wrap")}>
                    <PopupLineItem
                      legend="cases"
                      type="Cases"
                      count={
                        locationData.confirmedCasesIndian +
                        locationData.confirmedCasesForeign
                      }
                    />
                    <PopupLineItem
                      legend="cured"
                      type="Cured/Discharged"
                      count={locationData.discharged}
                    />
                    <PopupLineItem
                      legend="death"
                      type="Deaths"
                      count={locationData.deaths}
                    />
                  </div>
                </Popup>
              </Circle>
            );
          })}
        
        {viewTestCenters &&
          testCenters.map((testCenter) => {
            return (
              <Marker
                key={testCenter.city}
                position={[testCenter.longitude, testCenter.latitude]}
                onMouseOver={(e) => {
                  e.target.openPopup();
                }}
              >
                <Popup>
                  <h3>{(testCenter.city, testCenter.state)}</h3>
                  <a
                    href={
                      "https://www.google.com/maps/search/?api=1&query=" +
                      testCenter.longitude +
                      "," +
                      testCenter.latitude
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Maps
                  </a>
                </Popup>
              </Marker>
            );
          })}
      </Map>
    </div>
  );
}
