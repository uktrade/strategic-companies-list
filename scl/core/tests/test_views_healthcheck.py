from bs4 import BeautifulSoup
from django.urls import reverse


def test_healthcheck_lb(client):
    response = client.get(reverse("lb-healthcheck"))
    assert response.status_code == 200
    assert response.content.decode(response.charset) == "OK"


def test_healthcheck_xml(client):
    response = client.get(reverse("healthcheck"))
    assert response.status_code == 200
    soup = BeautifulSoup(response.content.decode(response.charset), features="lxml")
    assert soup.find("status").text == "OK"
