import React, { useEffect, useRef, useState } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import tt from '@tomtom-international/web-sdk-maps';
import axios from 'axios';
import { Backend_url } from '../../../BackendUrl';
import { Accordion, AccordionItem } from "@nextui-org/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { Avatar } from "@nextui-org/react";
import SendIcon from '@mui/icons-material/Send';
import { Input,Chip,User } from "@nextui-org/react";

const Preview = ({ step, setStep, selectedId, setSelectedId, getPickups }) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const [formData, setFormData] = useState(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [requests, setRequests] = useState([]);
  const { isOpen: isOpen1, onOpen: onOpen1, onClose } = useDisclosure(); // Ensure correct usage of useDisclosure
  const [newComment, setNewComment] = React.useState('');
  const [comments, setComments] = React.useState([]);
  const closeModal = () => {
    onClose();
  };

  const getComments = async () => {
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }

      const response = await axios.get(`${Backend_url}/api/v1/comment/get-all-comments?pickupId=${selectedId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      // console.log(response.data.data);

      if (response.data && response.data.success) {
        const response2 = response.data.data.map(submission => ({
          id: submission._id,
          message: submission.message,
          senderName: submission.sender.fullName,
          senderAvatar: submission.sender.avatar,
          time: submission.createdAt
        }));
        setComments(response2);
      } else {
        console.error("Error fetching submissions:", response.data.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    if (newComment.trim() === '') return;
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }
      const response = await axios.post(`${Backend_url}/api/v1/comment/create-comment?pickupId=${selectedId}`, {
        message: newComment
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data && response.data.success) {
        getComments();
      } else {
        console.error("Error adding comment:");
      }
    }
    catch (error) {
      console.error("Error adding comment:", error);
    }
    setNewComment('');
  };

  const paymentDone = async () => {
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }
      const response = await axios.post(`${Backend_url}/api/v1/pickup/markAsPaid?id=${selectedId}`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      console.error(error);
    }
    window.location.reload();
  };

  const openReq = async () => {
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }
      const response = await axios.get(`${Backend_url}/api/v1/request/view?pickupId=${selectedId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const requestsGot = response.data.data;
      setRequests(requestsGot);

    } catch (error) {
      console.error(error);
    }
    onOpen();
  };


  const markAsPaid = async () => {
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }
      const response = await axios.post(`${Backend_url}/api/v1/pickup/markAsPaid?id=${selectedId}`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log(response);
      // window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };



  const accept = async (request) => {
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }
      const response = await axios.post(`${Backend_url}/api/v1/request/accept?requestId=${request._id}`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };


  const getCookie = (name) => {
    const cookieString = document.cookie;
    const cookies = cookieString.split('; ');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  };

  const getDetails = async () => {
    try {
      const accessToken = getCookie('accessToken');
      if (!accessToken) {
        console.error("Access token not found");
        return null;
      }
      const response = await axios.get(`${Backend_url}/api/v1/pickup/details?id=${selectedId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const result = response.data.data;
      const fetchedData = {
        id: result.pickup._id,
        ownerName: result.owner.fullName,
        date: new Date(result.pickup.createdAt).toLocaleString(),
        status: result.pickup.status,
        workerName: result.worker?.fullName,
        workerPhone: result.worker?.contactNo,
        pickupTime: new Date(result.pickup?.timeArrival).toLocaleString(),
        imageUrl: result.pickup.thumbnail,
        items: result.pickup.items.map((item, index) => ({
          category: item,
          quantity: result.pickup.qty[index],
          description: result.pickup.itemDescription[index],
          price: result.pickup.customerPrice[index],
          offerPrice: result.pickup.workerPrice.length > 0 ? result.pickup.workerPrice[index] : 0,
        })),
      };
      setFormData(fetchedData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getDetails();
    getComments();
  }, [handleSubmit]);

  useEffect(() => {
    if (mapContainerRef.current) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          const { latitude, longitude } = position.coords;

          const map = tt.map({
            key: import.meta.env.VITE_TOM_TOM_API_KEY,
            container: mapContainerRef.current,
            center: [longitude, latitude],
            zoom: 18,
          });

          const marker = new tt.Marker()
            .setLngLat([longitude, latitude])
            .addTo(map);

          return () => map.remove();
        });
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    }
  }, [mapContainerRef.current]);

  if (!formData) {
    return <div>Loading...</div>;
  }

  const totalQuantity = formData.items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
  const totalPrice = formData.items.reduce((sum, item) => sum + (parseInt(item.quantity) * parseInt(item.price)), 0);
  const totalOfferPrice = formData.items.reduce((sum, item) => sum + (parseInt(item.quantity) * parseInt(item.offerPrice)), 0);

  return (
    <div className="mx-auto p-8 w-full bg-white-default rounded-md">
      <div className='mb-6'>
        <Typography variant='h4' className='text-center'>Pickup Details</Typography>
      </div>
      <div className='mb-8 space-y-2'>
        <p className='text-xl font-medium'>
          ID:{" "}
          <span className='text-[#6b738b] font-normal'>
            {formData.id}
          </span>
        </p>
        <p className='text-xl font-medium'>
          Owner Name:{" "}
          <span className='text-[#6b738b] font-normal'>
            {formData.ownerName}
          </span>
        </p>
        <p className='text-xl font-medium'>
          Date:{" "}
          <span className='text-[#6b738b] font-normal'>
            {formData.date}
          </span>
        </p>
        <p className='text-xl font-medium'>
          Status:{" "}
          <span className='text-[#6b738b] font-normal'>
            {formData.status}
          </span>
        </p>
        {formData.status !== "pending" && formData.status !== "cancelled" && (
          <p className='text-xl font-medium'>
            Worker Name:{" "}
            <span className='text-[#6b738b] font-normal'>
              {formData.workerName}
            </span>
          </p>
        )}
        {formData.status === "completed" || formData.status === "scheduled" &&
          <p className='text-xl font-medium'>
            Pickup Time:{" "}
            <span className='text-[#6b738b] font-normal'>
              {formData.pickupTime}
            </span>
          </p>
        }
      </div>
      <div className="w-full md:flex items-center">
        <div className='w-full'>
          <img src={formData.imageUrl} alt="Item Image" className="lg:w-[25vw] lg:h-[300px] md:w-[50vw] md:h[50vw] object-contain" />
        </div>

        <div
          id="map"
          ref={mapContainerRef}
          className='lg:flex justify-center items-center w-full'
          style={{ width: "100%", height: '300px', marginTop: '20px' }}
        />
      </div>
      <div className="mt-4">
        <TableContainer component={Paper}>
          <Table>
            <TableHead className='text-xs uppercase '>
              <TableRow>
                <TableCell><strong>Category Name</strong></TableCell>
                <TableCell><strong>Quantity (Kg)</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Demand Price/Kg</strong></TableCell>
                {formData.status !== "pending" && formData.status !== "cancelled" && <TableCell><strong>Offer Price/Kg</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell><strong>{item.category}</strong></TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  {formData.status !== "pending" && formData.status !== "cancelled" && <TableCell>{item.offerPrice}</TableCell>}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={1}><strong>Total:</strong></TableCell>
                <TableCell><strong>{totalQuantity}</strong></TableCell>
                <TableCell></TableCell>
                <TableCell><strong>{totalPrice}</strong></TableCell>
                {formData.status !== "pending" && formData.status !== "cancelled" && <TableCell><strong>{totalOfferPrice}</strong></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className='flex justify-between mt-8'>
        <Button color="success" variant='outlined' onClick={() => window.location.reload()}>Back</Button>
        {formData.status === "scheduled" && <Button variant='contained' color='primary' onClick={paymentDone}>Mark Payment Done</Button>}
        {formData.status === "pending" && <Button variant='contained' color="success" onClick={openReq}>View Request</Button>}
        {formData.status !== "pending" && formData.status !== "cancelled" && <Button variant='contained' color="success" onClick={
          () => {
            window.location.href = `tel:${formData.workerPhone}`;
          }
        }>Call {formData.workerName}</Button>}
        {formData.status !== "pending" && formData.status !== "cancelled" && <Button variant='contained' color="success" onClick={() => {
          onOpen1();
        }}>Chat With {formData.workerName}</Button>}
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior={'inside'} backdrop='blur' className='my-auto'>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">All Requests</ModalHeader>
              <ModalBody>

                {
                  requests.map((request, index) => {
                    const totalRequestOfferPrice = formData.items.reduce((sum, item, i) => {
                      const offerPrice = request.reqPrice[i];
                      return sum + (parseInt(item.quantity) * parseInt(offerPrice));
                    }, 0);

                    return (
                      <Accordion key={index} variant="splitted" className='rounded-lg bg-transparent'>
                        <AccordionItem title={request.owner.fullName}>
                          <div className='flex flex-col gap-2'>
                            <div className='flex justify-center items-center'>
                              <Avatar src={request.owner.avatar} className="w-20 h-20 text-large" />
                            </div>

                            <p className='text-lg font-medium'>Worker Name: {request.owner.fullName}</p>
                            <p className='text-lg font-medium'>Worker Phone: {request.owner.contactNo}</p>
                            <p className='text-lg font-medium'>Worker Address: {request.owner.address}</p>

                            <Table>
                              <TableHead className='text-xs uppercase '>
                                <TableRow>
                                  <TableCell><strong>Category Name</strong></TableCell>
                                  <TableCell><strong>Quantity (Kg)</strong></TableCell>
                                  <TableCell><strong>Description</strong></TableCell>
                                  <TableCell><strong>Demand Price/Kg</strong></TableCell>
                                  <TableCell><strong>Offer Price/Kg</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {formData.items.map((item, index) => (
                                  <TableRow key={index}>
                                    <TableCell><strong>{item.category}</strong></TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{item.price}</TableCell>
                                    <TableCell>{request.reqPrice[index]}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell colSpan={1}><strong>Total:</strong></TableCell>
                                  <TableCell><strong>{totalQuantity}</strong></TableCell>
                                  <TableCell></TableCell>
                                  <TableCell><strong>{totalPrice}</strong></TableCell>
                                  <TableCell><strong>{totalRequestOfferPrice}</strong></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            <div className='my-6 flex gap-6'>
                              <Button color="primary" variant='contained' onClick={
                                () => {
                                  window.location.href = `tel:${request.owner.contactNo}`;
                                }
                              }>Call</Button>
                              <Button color="success" variant='contained' onClick={() => { accept(request) }}>Accept Request</Button>
                            </div>
                          </div>
                        </AccordionItem>
                      </Accordion>
                    );
                  })
                }
              </ModalBody>
              <ModalFooter>
                <Button color="error" variant="contained" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal backdrop="blur" isOpen={isOpen1} onClose={closeModal} scrollBehavior="inside" className='h-auto my-auto' size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Chat</ModalHeader>
          <ModalBody>
            <div className="flex-col justify-between">
              <div className="w-full flex-col space-y-4 my-4">

                {comments?.map((comment, index) => (
                  <div>
                    <User
                      name={
                        <div>
                          <p className="text-lg font-bold">{comment.senderName}</p>
                          <div>
                            <Chip color="success" variant="flat">{new Date(comment.time).toLocaleString()}</Chip>
                          </div>

                        </div>
                      }
                      className="mb-2"
                      description={
                        <div>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                      }
                      avatarProps={{
                        src: comment.senderAvatar,

                      }}
                    />
                  </div>
                ))}


              </div>
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  name="comment"
                  label="Chat"
                  color="success"
                  type="text"
                  className="w-full"
                  size="sm"
                />
                <Button color="success" variant='contained' radius="sm" size="lg"
                  onClick={(e) => handleSubmit(e)}>
                 <SendIcon/>
                </Button>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="error" variant="contained" onClick={closeModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
};

export default Preview;
