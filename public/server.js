const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(cors());
app.use(express.json());

// API-nøkkel og URL
const API_KEY = 'a3b1ce6c50a7bec9c926958afac72628';
const API_URL = 'https://api.frontcore.com/v2/nextcoursedates';

// Rute for å hente neste kurs
app.get('/api/courses', async (req, res) => {
    try {
        console.log('Starter API-kall til Frontcore...');
        console.log('Prøver å nå:', API_URL);
        
        const response = await axios.get(API_URL, {
            headers: {
                'X-API-Key': API_KEY,
                'Accept': 'application/json'
            }
        });
        
        console.log('Status:', response.status);
        
        if (!response.data) {
            throw new Error('Ingen data mottatt fra API');
        }
        
        // Transformerer data til det formatet vi trenger
        const formattedCourses = response.data.map(course => ({
            id: course.coursedate_id,
            title: course.title,
            startDate: course.start_at,
            location: course.location.title,
            participantCount: course.seats.booking_status.num_confirmed || 0,  // Kun bekreftede påmeldinger
            maxParticipants: course.seats.allocated_capacity.num || 0  // Maks kapasitet
        }));
        
        console.log('Suksessfull respons fra API');
        res.json(formattedCourses);
    } catch (error) {
        console.error('API Feil:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: API_URL
        });
        
        res.status(500).json({ 
            error: 'Feil ved henting av kursdata',
            message: error.message
        });
    }
});

// I server.js, legg til en ny endpoint for å hente deltakere
app.get('/api/courses/:id/participants', async (req, res) => {
    try {
        console.log('Henter deltakere for kurs:', req.params.id);
        
        const response = await axios.get('https://api.frontcore.com/v2/participants', {
            headers: {
                'X-API-Key': API_KEY,
                'Accept': 'application/json'
            },
            params: {
                coursedate_id: req.params.id,
                limit: 250  // Maksimum antall resultater
            }
        });

        // Transformer deltakerdataene til et enklere format
        const formattedParticipants = response.data
            .filter(p => p.coursedate.id.toString() === req.params.id)
            .map(participant => {
                console.log('Deltaker data:', {
                    participantId: participant.id,
                    userName: `${participant.user.firstname || ''} ${participant.user.lastname || ''}`,
                    userCreatedAt: participant.user.created_at,
                    participantCreatedAt: participant.created_at
                });
                
                return {
                    id: participant.id,
                    name: `${participant.user.firstname || ''} ${participant.user.lastname || ''}`.trim(),
                    email: participant.user.email,
                    company: participant.user.company || participant.user.customer?.title,
                    phone: participant.user.phone,
                    status: participant.status.title,
                    paid: participant.paid.title,
                    completed: participant.completed ? 'Ja' : 'Nei',
                    registeredAt: participant.created_at  // Endret til å bruke participant.created_at i stedet
                };
            });

        console.log(`Fant ${formattedParticipants.length} deltakere for kurs ${req.params.id}`);
        res.json(formattedParticipants);

    } catch (error) {
        console.error('Feil ved henting av deltakere:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            courseId: req.params.id
        });
        
        res.status(500).json({ 
            error: 'Feil ved henting av deltakere',
            details: error.response?.data || error.message,
            courseId: req.params.id
        });
    }
});

// Legg til en test-endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API server fungerer!' });
});

app.listen(PORT, () => {
    console.log(`Server kjører på port ${PORT}`);
    console.log(`Test endepunkt: http://localhost:${PORT}/api/courses`);
}); 