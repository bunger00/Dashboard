import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import confetti from 'canvas-confetti';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f7;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 2rem;
`;

const CourseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #f5f5f7;
`;

const CourseItem = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  cursor: pointer;
`;

const CourseRow = styled.div`
  display: grid;
  grid-template-columns: 120px 2fr 200px 120px;
  align-items: center;
  padding: 1rem;
  gap: 2rem;

  &:hover {
    background: #f8f8f8;
  }
`;

const CourseTitle = styled.div`
  font-weight: 500;
  color: #1d1d1f;
`;

const Location = styled.div`
  color: #86868b;
`;

const Participants = styled.div`
  color: #86868b;
  font-size: 0.9rem;
  text-align: right;
`;

const ListHeader = styled.div`
  display: grid;
  grid-template-columns: 120px 2fr 200px 120px;
  padding: 1rem;
  background: #f5f5f7;
  color: #86868b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e5e5;
`;

const HeaderItem = styled.div`
  font-weight: 500;
  &:first-child {
    color: #666;
  }
  &:last-child {
    text-align: right;
  }
`;

const Participant = styled.div`
  padding: 0.8rem 0;
  display: grid;
  grid-template-columns: 2fr 2fr 120px 120px;
  gap: 1rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParticipantInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ParticipantName = styled.div`
  color: #1d1d1f;
  font-weight: 500;
`;

const ParticipantDetails = styled.div`
  color: #86868b;
  font-size: 0.9rem;
`;

const RegisteredDate = styled(ParticipantDetails)`
  text-align: right;
  white-space: nowrap;
`;

const ParticipantsList = styled.div`
  padding: 1rem 2rem;
  background: #f8f8f8;
  border-top: 1px solid #eee;
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
`;

const CourseDate = styled.div`
  color: #86868b;
  font-size: 0.9rem;
`;

const ConfettiButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

function App() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openCourseId, setOpenCourseId] = useState(null);
    const [participants, setParticipants] = useState({});

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('http://localhost:3008/api/courses');
                setCourses(response.data.slice(0, 10));
                setLoading(false);
            } catch (error) {
                console.error('Feil ved henting av kursdata:', error);
                setError('Kunne ikke hente kursdata. Vennligst prøv igjen senere.');
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleCourseClick = async (courseId) => {
        if (openCourseId === courseId) {
            setOpenCourseId(null);
            return;
        }

        try {
            if (!participants[courseId]) {
                const response = await axios.get(`http://localhost:3008/api/courses/${courseId}/participants`);
                setParticipants(prev => ({
                    ...prev,
                    [courseId]: response.data
                }));
            }
            setOpenCourseId(courseId);
        } catch (error) {
            console.error('Feil ved henting av deltakere:', error);
        }
    };

    const fireConfetti = () => {
        // Opprett flere konfetti-eksplosjoner
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    };

    if (loading) {
        return (
            <AppContainer>
                <Card>
                    <Title>Laster kurs...</Title>
                </Card>
            </AppContainer>
        );
    }

    if (error) {
        return (
            <AppContainer>
                <Card>
                    <Title style={{ color: '#ff3b30' }}>{error}</Title>
                </Card>
            </AppContainer>
        );
    }

    return (
        <AppContainer>
            <Card>
                <Title>Kommende Kurs</Title>
                <ListHeader>
                    <HeaderItem>DATO</HeaderItem>
                    <HeaderItem>KURS</HeaderItem>
                    <HeaderItem>FORM/STED</HeaderItem>
                    <HeaderItem>PÅMELDTE</HeaderItem>
                </ListHeader>
                <CourseList>
                    {courses.map(course => (
                        <CourseItem key={course.id} onClick={() => handleCourseClick(course.id)}>
                            <CourseRow>
                                <CourseDate>
                                    {new Date(course.startDate).toLocaleDateString('nb-NO', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                    })}
                                </CourseDate>
                                <CourseTitle>{course.title}</CourseTitle>
                                <Location>{course.location}</Location>
                                <Participants>
                                    {course.participantCount} / {course.maxParticipants}
                                </Participants>
                            </CourseRow>
                            <ParticipantsList $isOpen={openCourseId === course.id}>
                                <h3 style={{ margin: '0.5rem 0 1rem', color: '#1d1d1f' }}>Påmeldte deltakere</h3>
                                <Participant style={{ fontWeight: 'bold', color: '#666' }}>
                                    <div>Navn/Bedrift</div>
                                    <div>Kontakt</div>
                                    <div style={{ textAlign: 'right' }}>Status</div>
                                    <div style={{ textAlign: 'right' }}>Registrert</div>
                                </Participant>
                                {participants[course.id]?.map(participant => (
                                    <Participant key={participant.id}>
                                        <ParticipantInfo>
                                            <ParticipantName>{participant.name || 'Ikke oppgitt'}</ParticipantName>
                                            <ParticipantDetails>{participant.company || 'Ingen bedrift'}</ParticipantDetails>
                                        </ParticipantInfo>
                                        <ParticipantInfo>
                                            <ParticipantDetails>{participant.email || 'Ingen e-post'}</ParticipantDetails>
                                            <ParticipantDetails>{participant.phone || 'Ingen telefon'}</ParticipantDetails>
                                        </ParticipantInfo>
                                        <ParticipantDetails style={{ textAlign: 'right' }}>
                                            {participant.status}
                                        </ParticipantDetails>
                                        <RegisteredDate>
                                            {participant.registeredAt 
                                                ? new Date(participant.registeredAt).toLocaleDateString('nb-NO', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit'
                                                })
                                                : 'Ingen dato'
                                            }
                                        </RegisteredDate>
                                    </Participant>
                                ))}
                            </ParticipantsList>
                        </CourseItem>
                    ))}
                </CourseList>
            </Card>
            <ConfettiButton onClick={fireConfetti}>
                🎉 Feiring!
            </ConfettiButton>
        </AppContainer>
    );
}

export default App;