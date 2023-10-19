import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap, ZoomControl,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Dayjs } from 'dayjs';

import { useAuth } from "../auth/AuthContext";
import { useOrgan } from "../contexts/OrganizerContext";
import GreenIcon from "../constant/GreenIcon";

import { DatePicker, Modal, Space, Button } from "antd";
import CustomButton from "../component/ui/CustomButton";
import SlideCampaign from "../component/SlideCampaign/SlideCampaign";

import NewCampaignForm from "../component/form/CampaignForm/NewCampaignForm";
import { useCampaign } from "../contexts/CampaignContext";
import OrganizerSignupForm from "../component/form/OrganizerSignupForm/OganizerSignupForm";
import { CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import SearchBar from "../component/ui/SearchBar";
import { useMapItems } from "../contexts/MapItemsContext";
import GreenMarker from "../constant/GreenMarker";
import YellowMarker from "../constant/YellowMarker";
import RoutingMachine from "../component/RoutineMachine/RoutineMachine.js";


const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

interface LatLng {
  lat: number;
  lng: number;
}

interface LatLon {
  lat: number;
  lon: number;
}

interface CampaignProps {
  campaignName: string,
  receiveItems: string[],
  organizerName: string,
  address: string,
  openHour: string,
  closeHour: string,
  startDate: string,
  endDate: string,
  receiveGifts: string,
  organizerID: number,
  campaignID: number,
  lat: number,
  long: number,
  averageRating: number,
  icon?: any,
  description: string
}

function calculateEuclideanDistance(pos1: LatLng, pos2: LatLng) {
  const latDiff = pos2.lat - pos1.lat;
  const lngDiff = pos2.lng - pos1.lng;
  return Math.sqrt(latDiff ** 2 + lngDiff ** 2);
}

declare type EventValue<DateType> = DateType | null;
declare type RangeValue<DateType> = [EventValue<DateType>, EventValue<DateType>] | null;

type DateResult = RangeValue<Dayjs> | null;

export default function Home() {
  const auth = useAuth();
  const organizer = useOrgan();
  const [isMounted, setIsMounted] = useState(true);
  const { myPosition, setMyPosition, setCenterPosition, 
    zoomValue, setZoomValue, centerValue, setCenterValue, searchResult, setSearchResult,
    showDirection, setShowDirection, showWelcomeToWhatEver, setShowWelcomeToWhatEver, setHiddenClass} = useMapItems();
  const [dateResult, setDateResult] = useState<DateResult>(null);
  const mapRef = useRef<any>(null);

  const handleClick = () => {
    setShowWelcomeToWhatEver(true);
  };

  const {campaigns, setCampaigns, newCampaign, changedCampaigns, setChangedCampaigns} = useCampaign();

  function LocationMarker() {
    const map = useMap();
    const {mapInitialized, setMapInitialized} = useMapItems();

    useEffect(() => {
      if (!mapInitialized) {
      map.locate().on("locationfound", function (e) {
        setMyPosition(e.latlng);
        setCenterPosition({lat: e.latlng.lat, lng: e.latlng.lng});
        setCenterValue({lat: e.latlng.lat, lng: e.latlng.lng});
        map.flyTo(e.latlng, map.getZoom());
        const radius = e.accuracy;
        const circle = L.circle(e.latlng, radius);
        const popup = L.popup()
          .setLatLng(e.latlng)
          .setContent("<p>You are here</p>")
          .openOn(map);
        circle.addTo(map);
        popup.addTo(map);
        // setBbox(e.bounds.toBBoxString().split(","));
      });
      setMapInitialized(true);
    }}, [myPosition]);

    return null;
  }

  // const RecenterAutomatically = () => {
  //   const map = useMap();
  //   const {centerPosition} = useMapItems();
    
  //   useEffect(() => {
  //     map.flyTo([centerPosition.lat, centerPosition.lng], 13);
  //   }, [centerPosition]);
    
  //   return null;
  // };

  // const [campaigns, setCampaigns] = useState([])
  // const handleInputSearch = (location) => {
  //   setLat(location.lat);
  //   setLong(location.lon);
  //   console.log(location.lat, location.lon);
  // };
  const handleSearch = (searchResult: LatLon, dateResult: RangeValue<Dayjs>) => {
    setShowDirection(false);
    axios
      .get(`${API_ENDPOINT}/campaigns/all`, {
        headers: {
          "ngrok-skip-browser-warning": true,
        },
      })
      .then((response) => {
        // Assuming the response data is an array of campaigns
        response.data.map((campaign: CampaignProps) =>{
          campaign.icon = GreenMarker;
        });
        // Format results
        var customChangedCampaigns = [... response.data];

        if (dateResult) {
          // Format Date
          let date = dateResult[0] as any;
          let offset = date?.$d.getTimezoneOffset()
          let customDate = new Date(date?.$d.getTime() - (offset*60*1000))
          const startDate = customDate.toISOString().replace('T', ' ').substring(0, 10)

          date = dateResult[1]
          offset = date?.$d.getTimezoneOffset()
          customDate = new Date(date?.$d.getTime() - (offset*60*1000))
          const endDate = customDate.toISOString().replace('T', ' ').substring(0, 10)

          // Filter the campaigns
          customChangedCampaigns = customChangedCampaigns.filter(campaign =>
            endDate >= campaign.startDate.substring(0,10) 
            && startDate <= campaign.endDate.substring(0,10)
          );
        }

        if (searchResult && Object.keys(searchResult).length) {
          const customSearchResult = {lat: searchResult.lat, lng: searchResult.lon};
          customChangedCampaigns.sort((a, b) => 
            calculateEuclideanDistance({lat: a.lat, lng: a.long}, customSearchResult) - calculateEuclideanDistance({lat: b.lat, lng: b.long}, customSearchResult));
          customChangedCampaigns = customChangedCampaigns.slice(0, 5)
        }
        // 
        setCampaigns(response.data);
        setChangedCampaigns(customChangedCampaigns);
        // setSearchResult(null);
        setHiddenClass("");
      })
      .catch((error) => {
        // Handle any error that occurred during the request
        console.error("Error fetching campaigns:", error);
      });
  };

  // useLayoutEffect(() => {

  // }, [hiddenClass]);

  const { setShowNewCampaignForm } = useCampaign();
  const handleCreateCampaign = () => {
    setShowDirection(false);
    if (organizer.organizerID) {
      setShowNewCampaignForm(true);
    } else {
      // message.warning('Only organizer can create a new campaign')
      showConfirmModal();
    }
  };
  const { RangePicker } = DatePicker;
  // Confirm modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const showConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmOk = () => {
    organizer.setShowOrganizerSignupForm(true);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmCancel = () => {
    setIsConfirmModalOpen(false);
  };

  useEffect(() => {
    axios
      .get(`${API_ENDPOINT}/campaigns/all`, {
        headers: {
          "ngrok-skip-browser-warning": true,
        },
      })
      .then((response) => {
        // Assuming the response data is an array of campaigns
        response.data.map((campaign: CampaignProps) =>{
          campaign.icon = GreenMarker;
        });
        setCampaigns(response.data);
      })
      .catch((error) => {
        // Handle any error that occurred during the request
        console.error("Error fetching campaigns:", error);
      });
  }, [newCampaign]);

    useEffect(() => {
    if (changedCampaigns && changedCampaigns.length > 0 && !isMounted) {
      // let centerLat = 0;
      // let centerLng = 0;
      // const customCampaign = 
      campaigns.map((campaign) =>{
        if (changedCampaigns.find(item => item.campaignID === campaign.campaignID ||
          JSON.stringify(changedCampaigns[0]) === JSON.stringify(newCampaign))) {
        campaign.icon = YellowMarker;
        // centerLat += campaign.lat;
        // centerLng += campaign.long;
        }
      });
      const latLngs = changedCampaigns.map(point => L.latLng(point.lat, point.long));
      const bounds = L.latLngBounds(latLngs);
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
      // centerLat /= changedCampaigns.length;
      // centerLng /= changedCampaigns.length;
      setCenterPosition(mapRef.current.getCenter());
      setCenterValue(mapRef.current.getCenter());
      setZoomValue(mapRef.current.getZoom());
      }
    }
    setIsMounted(false);
    return () => {
      campaigns.map((campaign) => {
        campaign.icon = GreenIcon;
      })
    }
  }, [changedCampaigns]);

  useEffect(() => {
    const handleMapMoveEnd = () => {
      if (mapRef.current) {
      setCenterValue(mapRef.current.getCenter());
      setZoomValue(mapRef.current.getZoom());
      }
      };
      if (mapRef.current) {
        mapRef.current.on('moveend', handleMapMoveEnd);
    }

    return () => {
      if (mapRef.current) {
      mapRef.current.off('moveend', handleMapMoveEnd);
      }
    };
  }, [isMounted]);

  useEffect(() => {
    return () => {
    setShowDirection(false);
    }
  }, [])

  return (
    <>
    <div>
      <div className="">
        <MapContainer
          center={centerValue}
          ref={mapRef}
          zoom={zoomValue}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100vh" }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />
          <LocationMarker />
          {showDirection && <RoutingMachine />}
          {myPosition && <Marker position={myPosition} icon={GreenIcon}><Tooltip direction="top">Your Position</Tooltip></Marker>}
          {/* <div> */}
              {/* <Marker position={[lat, long]}></Marker> */}
          {/* <RecenterAutomatically /> */}
          {/* </div> */}
          {campaigns.map((campaign, index) => {
            return (
              <Marker position={[campaign.lat, campaign.long]} key={index} icon={campaign.icon}>
                <Tooltip direction="top" className="text-left">
                  <b style={{color: "#33BBC5"}}>{campaign.campaignName}</b> <br />
                  <b>Address:</b> {campaign.address} <br />
                  <b>From:</b> {campaign.startDate.substring(0,10)} <br />
                  <b>To:</b> {campaign.endDate.substring(0,10)}
                </Tooltip>
              </Marker>
            )
          })}
          <div
            style={{
              position: "absolute",
              // top: 10,
              // left: 10,
              zIndex: 500,
              width: "100%",
              height: "fit-content",
            }}
          >
            <div className="flex flex-col align-center justify-between h-full">
              <div>
              {!showWelcomeToWhatEver && <div className="flex flex-row align-center justify-between text-3xl font-bold p-4 bg-white bg-opacity-80">
                <div></div>
                <div><span className="flex-auto text-black">WELCOME TO</span> GREENDOTS!</div>
                <Button onClick={handleClick} className="flex-none" style={{border: "none", padding:"0", height:"fit-content"}}>
                  <CloseOutlined style={{display:"block"}}/>
                </Button>
              </div>}
              <div className=" flex justify-center items-center pt-4 pl-4 pr-4 space-x-4 w-full">
                {/* <SearchBar/> */}
               <SearchBar onLocationSearch={(location: any) => {setSearchResult({...location})}}/>
                
                <Space direction="vertical" size={12}>
                  <RangePicker onChange={(value)=>{setDateResult(value)}}/>
                </Space>
                {/* <Form>

                <Form.Item hasFeedback name="timeFrame" label="Time frame" {...dayRangeConfig}>
                    <RangePicker allowClear/>
                </Form.Item>
                </Form> */}
                <CustomButton title="Search" onClick= {() => handleSearch(searchResult, dateResult)} />
                
                {auth.isLoggedIn&&<CustomButton title="Create a new campaign" onClick = {handleCreateCampaign}/>}
              </div>
              </div>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              zIndex: 500,
              // left: "50%",
              // transform: "translateX(-50%)",
              bottom: 0,
              width: "66%",
              height: "fit-content",
            }}
          >
            <SlideCampaign slides={changedCampaigns}/>
          </div>
        </MapContainer>
      </div>
    </div>
    {auth.isLoggedIn&&<NewCampaignForm />}
    {organizer.showOrganizerSignupForm && <OrganizerSignupForm />}
    <Modal 
        centered 
        title = "Do you want to register as an organizer?"
        open={isConfirmModalOpen} 
        onOk={handleConfirmOk} onCancel={handleConfirmCancel}
        width={480}
      >
        <p>Only organizer can create a new campaign.</p>
      </Modal>
    </>
  );
}

