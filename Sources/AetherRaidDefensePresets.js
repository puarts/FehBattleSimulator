/**
 * @file
 * @brief 模擬戦機能で使用する飛空城防衛プリセットの定義です。
 */

const AetherRaidDefensePreset = {
    PresetDark20200809: 0,
    Yume20200821: 1,
    PresetDark20200822: 2,
    PresetAnima20200815: 3,
    PresetAnima20191014: 4,
    PresetAnima20190820: 5,
    KaibaMila20200823: 6,
    PresetDark20200627: 7,
    PresetAnima20200816: 8,
    PresetAnima20200826: 9,
    PresetAnima20201105: 10,
    PresetAnima20210216: 11,
};

/// 飛空城防衛プリセットを表すクラスです。
class AetherRaidDefensePresetInfo {
    constructor(id, title, setting, provider = "", season = SeasonType.None) {
        this.id = id;
        this.text = title;
        this.setting = setting;
        this.provider = provider;
        this.description = "";
        this.season = season;
    }

    getProviderHtml() {
        let html = "";
        const twitterUrl = "https://twitter.com/";
        if (this.provider.startsWith(twitterUrl)) {
            let twitterId = this.provider.substring(twitterUrl.length, this.provider.length);
            html += `提供者: <a href="${this.provider}" target="_blank" style="color:blue">${twitterId}</a>`;
        }
        return html;
    }
}

const AetherRaidDefensePresetOptions_AnimaSeason = [
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20210216,
        "[忘れられた]リターントラップ",
        "C4VwTgdg7glgJgUwLwFsCGAHJB2APgBlwEZiDTCAmMogLhAhmAH0F8kKAOAVlwBZDeRKrwBsHXF3ziOAThG5sAZhKTxisgFoSRQkRKEtuQ4RNGVZsqdOH1Awj1ultTggDpbrrlzoNmCIkhcnBZEiiLC2HiquCJEvAr48tGGKfoxuFQkxhYGztlWmllp/BJ8Ls7O+K7yVSLe9IwsFEgi+HhEXNhFfGK4HBQ8elzy2PgqHISO2eqpOXOGVPmWhbiOJQ7lm1WKPFW8Po0Iii16xFwc3R39EhTtOjLERBzxQXhTxaTx2d8kM2kFuTm6wymwqbg82AOfl4SEUoz6HHEggevAuElCCk6uBkWJ02C+3UM0hBs0BgIJywKpL49lBW08bl49V8LC4LQoulag1a8l4MiiUhiRDwShIozeK101HmaUM8iWVN+ZGBVClYP07jcIihLBE7Pa4QERF5XBIMgo6mNFDFygSD1m2TSlxlkspK2ywMGdI1dS13gAzsxjgHmDDaIGmGzw8xsC0aBGOIF48w9Eh9hGOkho0xjbDkznY9mnkmMzIs/mOeWI9aq8wKM1s2EcPm4c2I4JywBuUCQJhsdBYSpmHWsJCTZbYXZugEg7oz0yq5aGFGWEcBATkCTz6cgxb/HeL6xm1arhp+ZrjtKSHcz9R7m9kRxHvogkwj46UTfX7cFS1zbdPtK7SniyCAwmqZDfg+C5lAqbqHisUQgYcbKfqYXjQcsVA8HBBQIYC4g1AQI56rSV7xD+WGwfuM74SEAItmOZQhkw4HkPmqGlPg+axhuij5om6H5qmG4UMJnEkOmKakSCUkFkxVD8RmgknnJRBlguFZsOOLE1p+ukXqQLFNqYSlBrxpRie2AR/CENCdkAA"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20201105,
        "[廃墟]U字",
        "C4VwTgdg7glgJgUwLwFsCGAHJAmAPgBlwEYDjTC9CiAuECGYAfQXySIDYBmYgFgFZcPItwC0JPuzx8AHAE5cAdk7jOPXHlHjiAkmNx7C8wnt0lC58vpLdCPQgLUknZZ/gB07Am859a9JghEONLS6rIKVoLS3HzYEex8akpO+ApqGpF48qaRxmaZuZYWejaC9rjczlVk7j5ePn4MzNhIPHG4srKhejzsERLyndn4I7h8nJqRBhWCM9Pz+dMWxTm25XjV1bV8I7t7+zZufL50TQicrbIbRMeRveLY2Teesnz92KEZ03hqeaQLc3yy3+1lIdjGLkhWzcvyOjQCPGCAi4giIP3YoT4RDUfFkSWUY2x6kBxCoIMKixIaiWRUipXBDlImxq3i8x3hzD4SFioWE7CcnEkggxY2wAlxagxJC4nj0cqBU1WhT0AhpwPlYPK+WZZg8XgS1AAzkwLr5jYxETRzVyrUwFGwjUxpEgFI7GLIXW6bg7zRxuV77bbGERnWamEQPUHsKwo0Eoy0g4L/ebOPawxa4262j6mDwLjQANygSCMVjoLBkvIclhIWw1XD82nAiyUQrNpm0jX4atBQiVUhYptDr4K9ujxUEastCj1oRD9sj+cd9WrasXMn5fhL4GL9sWcdd6uIusWBTjvfEvBq2kH1enAJcyukTihC874nX4G33Ju9czHhZrWELdtaQHmG69r7m6zoziBTAejO2Beo+ZBIb67BAekAaYRUXowWQnBeghELptGQECGhTDYL2EKEea2DTgOv4YX2k4ppBMyURmQFUsQWaMWojhZn+M6FkAA=="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20190826,
        "[忘れられた]フラッシュヒールトラップ飛行パ",
        "C4VwTgdg7glgJgUwLwFsCGAHJB2APgBlwEYDizCAmUogLhAhmAH0F8kBmADgDZdOBOXABYivIdzwBWCr0kDc3foUkTcAWhIb1JIsu36thQ/qMlC50qdx5CQvezI7HxOg2YIiSIoOyc8IhyFJEmlOBXZJBX4Q7CEDTR1CBwSTXEErFIss1Ns9KicCl3pGFgokMN8xIkDVaV5uCKjlbjCtNsTcByp20nT9brNLIeNc3EjCidcShHYkCklI9nYU8TDOfEiGzejifFj4/V0x3AHU4y0HEaGrCztjh0IJorcWIQ4KNfwqklWxoPDtiQWqcehYeudBlo4ldslDSHdIlRHs4dFN3JI5vwfHJhAj8A5JNhBA0HIogY1wYMHp1UkRISEctd9JFRuNqCiXABnZizSQ0blMN60AUY4XMbBIbj85icHDSpj8JB8gVEUXy0RK9USsVMIiy5XMbxeeUUNg6iiec1lHXsbiS+XsCVSgUiY0AblAkCYbHQWGRpjRLDYSXIuKZ2QsVEugwj7NhmUDHiQlFDQjisdjVGhMfDobBCeK7jKyMGQhsueyVFOGbjwwLLxmyZptxzNZT1YredIoMTbxTFltncrJ0ZsdbB3wiYx/vh45rVdHTPHPYFs1snXlfcs8unxwo8olFh1svXk4Fisj6t3SXVdpT7C1Ta66pPNIfKovI4NTFNTZ+Js8dcrT/MYHTvY4bUPY4z2YV1o0OGg3SAA="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20200816,
        "[廃墟]伝令ルピナス",
        "C4VwTgdg7glgJgUwLwFsCGAHJAmAPgBlwEZjTDC9CiAuECGYAfQXyQFZ8B2XATh5IC0JHmwAsuNgDY8bHuM7ZuY7ngDMuIcULq8mzYX0aSB4wTPkjudYVGE2uPCSekntekwREko/sSJsnfzxRSQAOXmx1EUIeUMcucTVLU0FUs0NNNItsy0NbCRdC5xo6BmZsb0VeWMsQ8KkeasaifFaJVXU9NJarB1zTDJJdUxyTSxs7cyKXNzKEVUqYnhsiYfb6uVww+22+zucxrvSBkn2pnM1rXHz7SmnXUo9RdmxwolVJJw/gsIlse1k4n4JE4qnsR0uZnERzGY2hI3O/ShkxS91mHjY3kk4hanHBJDqEW4uMkWziEkkjSSmQofRh40s+MRFnpN16VDRAGcmAs2NRuYxnjQBZjhUxOEhJPymKEkJxpYweJKFf4kGLGERJOwVRL1URZXyBUQlersKxTV5TRV1R9lQLVBKpQLRJaFaJrW6FjQANygSCMVjoLAIoTo5isWmmKTMmN4NajKZ3Fkkez4MOeJAcqNJmMWOMMhO0i4giTpiraKaiVO5xN0hEJnNjUmidMLItmDg1nJ3QyFvrFgqqdPPDkWfJ97t1rv9qaaRLpzEJtjVidmfO92OI7AAalOxAVbdIhqYI4KaZFmbMQ4FEpsDgVsos6qVd71i9I2BVWoretvfU/RqPr0AFMMal42AqZqXgCkFeBWx6MNg5Ydge37XAQB5/vY6oupeBL7s6yHiDinrgX0PpAA="
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20190820,
        "[溶岩]開幕35ダメ、恐怖のクロニエ城",
        // "C4VwTgdg7glgJgUwLwFsCGAHJBOAPgBlwEYDizCBmUogLhAhmAH0F8kKKB2XADgCYSAFiJVB2bvz64AbPkL8q0ogFZcAWhIb1JIoSmDthwluMlTpQpdJaTuQYVUHCOsjroNmCIuy68BdkTtxPylZeT5FImlDGx1KO2szI0NNJKsrWNJ7XFVVF3zid0YWPh8Jf2FRYMkZOT8qZUEpTK1dXCpm1MTuzos+81tsvNcRt3pihAoyvyFAsXLQuoUZIgMWuPaEzPNzKlt07sGHXClnUcLxz0Fp-lmqhdrwhuEYrrbRTdsvoWSDgaShpsCvkip5lEh7AZsMoeAEqNCDMolLw2pw+NF1q8sV1zKoMmk+nshGcqPEzsCaABnZhTZRU5jXWjUpjgpnMaRIaT0picTncnh85nYQXMXRITjclRINlMIi8mVEAV05lEYUyvhsdXedWlGXCaU0ADcoEgTDY6CwZ1MoJYbEITlIylJ-RdZ1U+1d1D62xtXiQxySTs9fzI7oJB3DZH2vtK5MdzpDEZyvxdkZxBF9Uz0fSDidTyY9eYJPsuLGu8UDCeDXrD1at3pxvvBZNIGrrfSkvRDkfrJm5Wc2gm55eTFG5zfI3I58T43N5VlnzIFx3w3OF6UlduokonVDHKvnCUXouXJxOkvXCSHzI1-rI1+YAjvJH3j9jpFfTH1RJSRqAA"
        // "turnwide=map=9|0|1|0|1|1|0|0|0|1:unit_e0=337|821|413|497|822|600|823|615|-1|-1|-1|10|2|4|-1|-1|0|-1|0|-1|0|-1|0|0|0|0|0|-1|-1|0|40|5|4|0|1|1|1|1|1:unit_e1=337|821|413|497|822|600|823|616|-1|-1|-1|10|3|4|0|-1|0|-1|0|-1|1|-1|0|0|0|0|0|-1|-1|0|40|5|5|1|1|1|1|1|1:unit_e2=337|821|413|497|822|600|823|542|-1|-1|-1|10|3|2|-1|-1|0|-1|0|-1|2|-1|0|0|0|0|0|-1|-1|0|40|5|1|1|1|1|1|1|1:unit_e3=337|821|413|497|822|600|823|614|-1|-1|-1|10|3|4|-1|-1|0|-1|0|-1|3|-1|0|0|0|0|0|-1|-1|0|40|5|2|0|1|1|1|1|1:unit_e4=337|821|413|497|822|600|823|541|-1|-1|-1|10|3|4|3|-1|0|-1|0|-1|4|-1|0|0|0|0|0|-1|-1|0|40|5|3|1|1|1|1|1|1:unit_e5=404|958|413|954|561|810|726|-1|-1|-1|-1|-1|-1|-1|1|-1|0|-1|5|0|0|-1|0|0|0|0|3|-1|40|1|3|0|3|0|1|1|1|1|1:st_3=5:st_5=1:st_6=6:st_7=6:st_8=6:st_9=6:st_10=7:st_15=1:st_17=1:st_18=5:st_19=1:st_20=1:st_21=1:st_22=1:st_41=1:;turn_0=map=0|1|0|-1:unit_e0=0|4|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e1=0|5|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e2=0|1|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e3=0|2|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e4=0|3|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e5=0|3|0|0|20|0|0|0|0|0|0|0|0|2|2|-1|0|0|0|0|1|0|0|0|0|1|0|-1|0:st_3=0|3|4:st_5=0|1|0:st_6=0|3|2:st_7=0|0|2:st_8=0|5|0:st_9=0|0|0:st_10=0|0|1:st_15=0|3|3:st_17=0|4|2:st_18=0|2|2:st_19=0|4|4:st_20=0|1|4:st_21=0|1|3:st_22=0|0|3:st_41=3|-1|-1|1:;"
        // "turnwide=map=9|0|1|0|1|1|0|0|0|1:unit_e0=337|821|413|497|822|600|823|615|-1|-1|-1|10|2|4|-1|-1|0|-1|0|-1|0|-1|0|0|0|0|0|-1|-1|0|40|5|4|0|1|1|1|1|1:unit_e1=337|821|413|497|822|600|823|616|-1|-1|-1|10|3|4|0|-1|0|-1|0|-1|1|-1|0|0|0|0|0|-1|-1|0|40|5|5|1|1|1|1|1|1:unit_e2=337|821|413|497|822|600|823|542|-1|-1|-1|10|3|2|-1|-1|0|-1|0|-1|2|-1|0|0|0|0|0|-1|-1|0|40|5|1|1|1|1|1|1|1:unit_e3=337|821|413|497|822|600|823|614|-1|-1|-1|10|3|4|-1|-1|0|-1|0|-1|3|-1|0|0|0|0|0|-1|-1|0|40|5|2|0|1|1|1|1|1:unit_e4=337|821|413|497|822|600|823|541|-1|-1|-1|10|3|4|3|-1|0|-1|0|-1|4|-1|0|0|0|0|0|-1|-1|0|40|5|3|1|1|1|1|1|1:unit_e5=404|958|413|954|561|810|726|-1|-1|-1|-1|-1|-1|-1|1|-1|0|-1|5|0|0|-1|0|0|0|0|3|-1|40|1|3|0|3|0|1|1|1|1|1:st_3=5:st_4=1:st_5=1:st_6=6:st_7=6:st_8=6:st_9=6:st_10=7:st_15=1:st_17=1:st_18=5:st_19=1:st_20=1:st_21=1:st_22=1:st_41=1:;turn_0=map=0|1|0|-1:unit_e0=0|4|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e1=0|5|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e2=0|1|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|1|0|0|0|1|-1|0|0:unit_e3=0|2|0|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|0|1|0|0|-1|-1|0:unit_e4=0|3|1|0|53|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e5=0|3|0|0|20|0|0|0|0|0|0|0|0|2|2|-1|0|0|0|0|1|0|0|0|0|1|0|-1|0:st_3=0|3|4:st_4=0|5|3:st_5=0|1|0:st_6=0|3|2:st_7=0|0|2:st_8=0|5|0:st_9=0|0|0:st_10=0|0|1:st_15=0|3|3:st_17=0|4|2:st_18=0|2|2:st_19=0|4|4:st_20=0|1|4:st_21=0|1|3:st_22=0|0|3:st_41=3|-1|-1|1:;"
        "turnwide=map=9|0|1|0|1|1|0|0|0|1:unit_e0=337|821|413|497|822|600|823|615|-1|-1|-1|10|2|4|-1|-1|0|-1|0|-1|0|-1|0|0|0|0|0|-1|-1|0|40|5|4|0|1|1|1|1|1:unit_e1=337|821|413|497|822|600|823|616|-1|-1|-1|10|3|4|0|-1|0|-1|0|-1|1|-1|0|0|0|0|0|-1|-1|0|40|5|5|1|1|1|1|1|1:unit_e2=337|821|413|497|822|600|823|542|-1|-1|-1|10|3|2|-1|-1|0|-1|0|-1|2|-1|0|0|0|0|0|-1|-1|0|40|5|1|1|1|1|1|1|1:unit_e3=337|821|413|497|822|600|823|614|-1|-1|-1|10|3|4|-1|-1|0|-1|0|-1|3|-1|0|0|0|0|0|-1|-1|0|40|5|2|0|1|1|1|1|1:unit_e4=337|821|413|497|822|600|823|541|-1|-1|-1|10|3|4|3|-1|0|-1|0|-1|4|-1|0|0|0|0|0|-1|-1|0|40|5|3|1|1|1|1|1|1:unit_e5=404|958|413|954|561|810|726|570|0|0|0|10|5|-1|-1|-1|1|-1|0|-1|5|0|0|0|0|0|0|0|3|0|40|5|3|0|1|1|1|1|1:st_3=5:st_4=1:st_5=1:st_6=6:st_7=6:st_8=6:st_9=6:st_15=1:st_17=1:st_18=5:st_19=1:st_20=1:st_21=1:st_22=1:st_36=6:st_41=1:;turn_0=map=0|1|0|-1:unit_e0=0|4|0|0|50|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e1=0|5|1|0|48|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e2=0|1|1|0|50|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e3=0|2|0|0|50|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e4=0|3|1|0|51|0|0|0|0|0|0|0|0|1|5|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:unit_e5=0|3|0|0|85|0|0|0|0|0|0|0|0|2|2|-1|0|0|0|0|0|0|1|0|0|0|-1|-1|0:st_3=0|3|4:st_4=0|5|3:st_5=0|1|0:st_6=0|3|2:st_7=0|0|2:st_8=0|5|0:st_9=0|0|0:st_15=0|3|3:st_17=0|4|2:st_18=0|2|2:st_19=0|4|4:st_20=0|1|4:st_21=0|1|3:st_22=0|0|3:st_36=0|0|1:st_41=3|-1|-1|1:;"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20200815,
        "[氷雪]攻めにくい、受けにくい",
        "C4VwTgdg7glgJgUwLwFsCGAHJBGAPgBlz0L2NwGYCiAuECGYAfQXxwDY2iAOATlwBZsAVgFsuuHgHY8PIQCYi+JbiFt+VBZWyERAWjz7chwsaNlThS1UOVC-HbgWkiL0rXpME2JPy6ds2OTqAeQi-GIqwkSBnGIibFGEmo5UJgbmGS4WqdZ4tgIOzkWu7gzMckhceZSG-DycUnhCvLhifNqS6kkUiipm-aZ8aSnZVsNaBX0krjPYpZ7kSOTkkrhccnj8cgrhCqp7POrrlHED6QJ9hleZ4-1jOddU9n0K08VzdGUI-D5yqzw8cS1CKNCQAxTKVR8R6GbR9c6mRGbO45KyPOyFKjvGifTxCJDycQxUjkNg7KQqOTxUkSAK4ST4VYwvJ9GrnYbDPRke7DUzPERWbFzADOTEWQmoosYPxFTHxssYkiQkklTC4ytVjG0GqlAR8muEOANbAJBqVCuw6olup4RqlclYCo2dqY2xdjFJSDkmsERoA3KBIIxWOgsNM0vNmKxumRVKj41ZKApRvHubk7pGvEg3lQIjyEylk2n88WzgRMxVBbmBQX7pQubWsfH0ZnFt0rPJG-c8EWuy57i3ccwfuGnjX8-cFL2J02B+zM-j84I+1Y9iiZ6WW1K21RrUwR1NNYunpqlYnNerVwboz18AbvHZy7rjyJvbqTd091qzylyAbL4WBq2tMf72jeTSas60z8JBlYXAqnqEFoPreGy-RzH6QA",
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetAnima20191014,
        "[氷雪]ドマドマクリセシ",
        "C4VwTgdg7glgJgUwLwFsCGAHJBGAPgBlz0L2NwGYCiAuECGYAfQXxwFY9zs3cBaPACwA2AOy425HmwCcA3EIAcAJiL4RcwoX64FuOXO3aSmvmSNUTWzlQGEpVUkSfZa9JgmxJySwuQVW9NiEdJR4hfDwRcjlsNV0TbVjxUxTzeJS8c0sqbUpCW2SY52KXOgZmJSQlfwphPQK2fCkRaXlveSFWoWwNHMiKXBVDMmwVAKGybIC8vTsBkhKaMvdyL3IxZUFsYOFdNmrxWRDKNhFg4ZSxIouA6ZSpvvvZ5J5HN6W3ZgE1jaUtnl24gOMjkyhOIh4F20rUolBuT20BkmFke5gaA3eb1c5QQbCqCh47QEoz0inE+D2RyieA4vQCSV0mSZDkekOR2VyNjmvUxNAAzkxVmxqALGN8XKK8RKmCIkCIRUwFHKFYxpEghCrtkhhaLsLLpYxsEqdUxsGqDT4cCq-lbRUpKgbyEJ1Sr1i7RcSrQBuUCQRisdBYBZWbHuVhzEwcFEPEwqOHs6NODnM-Ch5iefJJw6JmPOW4s5GJFE3NMISq+FECVq57KOLIousJhalT4IVZzMhVnPdxs9pz1kykUvfCtkCTdh54CYFxNFhIp0t4zMmEQ1xMqFN92tPVOi9uFFUjhwqpdUJQq2VzcgqpVzc+itUma+650V++my+DAia296Qaax8qBNRhLTmYCbRMARrXLP9gKdJBg1dT9NEPTx4wyagvSAA"
    ),
];

const AetherRaidDefensePresetOptions_DarkSeason = [
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.KaibaMila20200823,
        "[忘れられた]ミラミラミラミラ",
        "C4VwTgdg7glgJgUwLwFsCGAHJB2APgRlwAYDTDCAmYggLhAhmAH0EikKBWA7KgWkIAsHLhwBsefAGZsADlzZJXfERlU1uKsoIlC/XHpIBOagY3USFk4UsCSSsg/J0GzBPiQcKAgopLYxuAKiclIchIaKPp64ovjeegnW1JJmpmnk+kmWlonUtrhclhnFzowsFB5eUUZEXEEhioSxolFUooYtuaYkKXxJ6alZ5laZeXakOo609GUIkpXeoTpERILBUYQyQa0xMlxdQ959IyR6Kd3Dp7pJ+VxUk8XTLiwCC9XyAfUbuBFKim1bUa5LTec7XE6jeJDbJAm7jFIPRylVwcJBCchEATgoRcDqaZTGQxEYzCOTqTTLWGjK4jO6XYYXW64FKPEoAZ2Y8w4NA5TFe+B5zFRAt5oiQIuY2A8gqYMhwMuU4oVwoVYolTHwUvV+DlFAVhiVvIobHVFHcpoq6skYskMuk7BlWKVAG5QJAmGx0FgMldkSw2Ii/IV6TCSFQwSHhvcGYRCn63EhQ4FoZGw4NU9RozlCHhuTNXBVJjYU0m08dS5n6XoWgJ4/M08WMzD1Bck1nacz468esNthXm+n+2YYXojvHUT2ku0m1HmdSM+2wwBqQgsu2JwIFR0bsMyicFYgysXjPW8qUkMe8uVp7UBzfa/cpW28/DHuen5iajdUWsv69mZ9PwNNNuSNO9YxlM0NxSUDmAoQtN1/Tk3yUO1z03IhHXcCM9AFZ0gA",
        "https://twitter.com/kaiba51480780"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetDark20200627,
        "[泉]霧亜、アルシャロ、ブラミの鉄壁",
        "C4VwTgdg7glgJgUwLwFsCGAHJAGAPgRlz0JINwCYiCAuECGYAfQWyQFZtL98B2ANlwBaQgBY2A7jx4F82AJwyeADgLYeIoYWGaylStu15DOo4Tzmqpk7hF42NsqSe16TBPiQipM7Cu1jibF8fBTk2aTYAZg1iHQV7LUSqY20ki3SdMxs7XEjHfJIXBmZyTz4VWTkrANVg7nlcHkiSNRVY1JyklKztfSyMqyzbXHsuAscit0jPJQl8aJlI+xFykbr5gSbCcsp2wgqdAx7j3OsBzKph5aonCbpihBEkJYVZgRF8ZdW5Hns2OQ0cm4uHK9iOOgECUOJ2qZ0syTS2RGp1it3wk2YbCQ5CUy2W+EoKxUHBUSjkm2ajXIAj2qhBCOseSsYP68MGlxyu3GhQAzkxpmxqHzGE90cKsWKmEokDwhUw5Eg+HLGLIZcrPkhJSq+Ox1TxNerpYLhfgFVryKxzR5zaUtZF9UrhZEFcamB8DQBuUCQRisdBYVnCDEsHAOIas84WSh5YyRihsnT2bDBjx4PJZKIJuOEuHnLkWbQRYOlPBjOw0rMJ6O5qsJ7TvYPTPAxKh8CtxqPx2OV/MM+yRYNPNPwkS9jvxvqVzsZfwUYNY0vwvgKcedyfjscUADUhHTyqbp1dItDpeVC5uyulsWTwoV6XVrGH5HV595THwOubuT1ob0htDGjPiad5kEeFqhn8yrkKm8ZgSWDhHvaEE0E6IFJsq7oxkk6IekAA===",
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetDark20200809,
        "[泉]害悪補助親子",
        "C4VwTgdg7glgJgUwLwFsCGAHJAGAPgRlzz0MLwGYiCAuECGYAfQWyXwDZ2CBOb3b7AFZ+ggCz8A7IW6CATLgnY8g-BKqUAtKTzytuPXpLF9ZE1WPG9p0ctzjSBR6Vr0mCfElnY+s0cNGylKLsABy4clzsXgpK4eSUFGb4ibqEhgSWDukWVFZUNuG4lA4lNHQMzLJIotyk+CoE9fLB8oLs0oJ4AnyCvOpJieIGpul6qeYTeMP5tvKlJS4VCORInXOqXHrBYfiqarvejRI72BJDaRcZhYSaI3dFZjmZj3a2805lrsyi1diUMv4OCIuBFwtxxDI1IIzmZpslcPJxqN7udJhNpngCv4qO98Is3IJPBJEfhxKJ4nZQnFKL1xKFhMluGFElZZnYXsjCtk0RjXtccR9nABnJgrQTUEWMH54yWEmVMCRICQSpghJUqxjcdWS5Lapj1NgajirI2K+WMfBq8U6rXmryGyWyDx2qrm8iK5WS0TO6gAblAkEYrHQWBIuTx5TcrExjmUpieaMo4wTxnj4ce+OYHkSpgaKcTCJe+bTU0u2EzCCqOlj4S4+ZyiKLaLDOQxFZWYes4nrE0b3ITJdhZArPxjxmCzcnfcHOUHbcjzEJLaoecnDcL-bRc7LGo7K41o8K5dlOHMGsVxnIGrViWPTC1tivOujhbvFqXjmt+vYp5pptPrRGje7JfhaD44hq9q2KIkHZoUoGyFWVCyLuF7XAeHi3EkfpAA"
    ),
    new AetherRaidDefensePresetInfo(
        AetherRaidDefensePreset.PresetDark20200822,
        "[溶岩]遠距離受け耐久盛り盛りクロム",
        "C4VwTgdg7glgJgUwLwFsCGAHJBOAPgRlwAZiCySBmU-ALhAhmAH0EikAWbQ-fAVm74AmXOwBswgBxFeubLxI8J7XLwDsosgFpC23Bpk7DpXSRO4zJS8aMl2JGcO5knteoxb4kEwhSq72qqq4EoIyvBJ4+ETRBETYElpGUSq4wrpmeKZOFqRWZoR2KS7OznQMzAiCSBSChNjYJKoRIqIJ6hqiFB0SMq0G5kYyCgMjWdapo7lT6YQK9tQlLmXuCBQcvBr1c6IFrbjtKtjKfXpSIzOxpGk2k7p+s1N5N4UOC8Wu5SzsHPjC2KrKdiCQHiYLSWTqAj4JR6LqJEbJfoXMZjZQ5Kwo0gvciLUpuCq8HAJQSiNG7II8QJQuJQmG8QQJIy6RHwsxswgydHTB62eZWd4EGgAZ2Ya14wuY31oIqYhOlzFUHAlTAkSHFMp4So1cuV+FEat1ivlTGhBo12CQxsEbCtnitVWNXUtyooivYyvYdpoAG5QJAmGx0FhhlllhU2CRHKR5I9Y1ZhNc41MeeMTGGPEhhg9eMoMUnKBMuXmU2M0-iWFV+VchvmpgnJnmq3nkenVpmJlYgbW8-Wi8nYy3ywhviGsRpG0neyXY9PB58EISJ+wEhOJ1R7t2cU9Ri727YPXvcBRlYuUkRlYr5sbVfHdZ4C+fte2qMa9e2fIb36ldTeJoJdRa8zqsw1rtsowFMLUX4QYIlYpMeMpOrY36IZeIjEB6ngbsyPpAA"
    ),
];

let _offenseAstraPresetId = 0;
const AetherRaidOffensePresetOptions_AstraSeason = [
    new AetherRaidDefensePresetInfo(
        _offenseAstraPresetId++,
        "フレン&ブルーニャ",
        "C4VwTgdg7glgJgUwLwgjYB9AhgBiQVgA4BGAH2Px33IDYcbzKB2UgTibJoGYvSbDq/agCZSOMeXHUAtGVml54xQrLjVE8ZpWlR4gCxSdfcibJmxAOj2WaALlTpsxJFxJtivPcWt7+pfMIMNPhkrBSkTDgs8jFmhnIJEsryiVpp2soG/hIM5nmW+NQ4Fvj2aJhYwkh6AZJ6ol68xDh6TS3W+KwMkQz4XKwZic2k1onJ6vKiyulKqSOG1rmmy8U1NmWOWFxIdGr4XiPCohT1bMIsrLU0NAN9vLHaw/djE6+kzxqfs9r6hrxL+VUJUsNQ2FT0BCYTT0hEI5BhAxSOCOkkC8NY4n43wewzUgySb2s0y++N+2UEy3yxV4xSYpQcFXw1RCdTIjRGNFEhA4bFY1gxAyYQqMWmGwymZBpP201HUM20unm2U4lJWVgKpQA3KBIBg8AzsHhxKIGJjTST5cdpfLjRI3nCimIwU4kFpzacbSTRBKLZ9FW9HZpnZVXSNjPoWJ70t7rb7/QTlRpg9txP8JHprFHPrwPlmpW8GIqcMGIYZ3YHfVpFcT5eoC+8kwasEy8eaoZWvUYayS6wmWJmnZqgA=",
    ),
    new AetherRaidDefensePresetInfo(
        _offenseAstraPresetId++,
        "伝エガ&リリス",
        "C4VwTgdg7glgJgUwLwgjYB9AhgBiQVhwBYAfARjIA4BmEos2ogNkvJzIE4T9KuLLS+AOykATCRwSpkgLRkSchfNnz8DErUnLpOxeMlFJ+EuKblz8yxIB0xnLfwAuVOmxkk1SvI7r6pZqz4omZMaiQ+xkI4QkqximRG5oqKKlLxsZKZuvIpdImSZlZFNvh2ts5omFiiSERBbETi9LQJRC3EghxmUWb41FzJOZYGSUNp2noZOlmDUobcdCSFFiv2dTZMFa5Y1EhMOFr49HSi4mRH4hyiMRz1TExcfbSz8ZLPY7mf8u/T2VPzxloy2KylsNjqWyqRAIQhaREorDI8IGw1ObGC5CIHAKlFSswSUg+E2JC1yWRmYwMiWMwJWoM01iEThcVXwBHUDBwTV8XXRiOoOBaAtICSErH0hK0WlimlihFIjHM5L+uQB5lpxXsZi1TgA3KBIBg8CzsHhJKYpPguMqbVIJWTfubCeMSIFpJC3EgstqTo6/eJxA7bRKSXZ3Sbql7Fj6iDFbcGTFN44npaljNocB6dlGgXNSMnlbQfgWNM7UmYJZmI9DEjGwyWnakS9oSWZZVXKtg2dKfVE/bbvkm/S2XTF8xJHLqgA=",
    ),
];

let _offenseLightPresetId = 0;
const AetherRaidOffensePresetOptions_LightSeason = [
    new AetherRaidDefensePresetInfo(
        _offenseLightPresetId++,
        "W伝承リーフ",
        "C4VwTgdg7glgJgUwLwgjYB9AhgBiQZgEYA2AHwA5DzSAWQm246gVgCYzzidSB2H/XjgCcpALSExE8b1ICp80t2aLJK6dw0ru09bSWlWpMhJOlTOAHStll5swBcqdNkJIazYzmbVCOYhJomXiFuYnwyHj8jcm0FaWVDWNUkpIVNdNVdGn0JYzN88wsBS3dHNEwsViQ2BkJ8Zm46ARoeMjZlZiEROrZBHkyFZvydCRTVQ10MpKz9BjzTQv7LHjLnLHw3fG6cVka6sx2THcNiMN5WEWYaQzkDA/u40eTVAUmtNTS9UmUBeYL82yKCylJwVGibba7Wj7XysCRsfqdMinbY8ai3Qy+B4DD64hhvDIjFTZb4qP4LIE2YEOUHYZhIfwmbwKQjeCYSTj9EIiaQY96PXFJZQE95Exr6IkUwrFCw8BwAblAkAweFpuCQ3BOxKeU3emruIoyTyeYq0qwqrm4uWJIl1usM7L1TuNuIJ5uwVUaRmJDDtTodzz9LumOsU7vWGtk3tCob93AEr1jzpUJs+GnD4M0ZBjTr9CcDuYBRdN6bV9MTzyuhd1t0N/JTrtj9nlQA==",
    ),


];


function findAetherRaidDefensePreset(id) {
    for (let option of AetherRaidDefensePresetOptions_DarkSeason) {
        if (option.id == id) {
            return option;
        }
    }
    for (let option of AetherRaidDefensePresetOptions_AnimaSeason) {
        if (option.id == id) {
            return option;
        }
    }
    return null;
}
