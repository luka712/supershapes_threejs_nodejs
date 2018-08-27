$(function () {
    var scene = new THREE.Scene(),
        renderDoc = $("#renderer"),
        controlsDoc = $("#controls"),
        camera = new THREE.PerspectiveCamera(75, renderDoc.width() / renderDoc.height(), 0.1, 1000),
        renderer = new THREE.WebGLRenderer(),
        exporter = new THREE.OBJExporter(),
        formData = {
            subdivisions: 50,
            radius: 2,
            angle: 1,
            scale: 1,
            ss1m: 12,
            ss1n1: 0.5,
            ss1n2: 1,
            ss1n3: 3,
            ss2m: 12,
            ss2n1: 0.5,
            ss2n2: 1,
            ss2n3: 3,
            "background color": [150, 75, 50],
            "material color": [50, 50, 255],
        },
        model = null,
        apiModel = {
            pages: 5,
            loadMoreIncrement: 5
        },
        gui = null,
        successAlert = $('.jq-success-alert'),
        errorAlert = $('.jq-error-alert'),
        updateButton = $('#model-update'),
        deleteButton = $('#model-delete'),
        notification = {
            success: function (msg) {
                successAlert.show();
                successAlert.html(msg);
                successAlert.fadeOut(2000);
            },
            error: function (msg) {
                errorAlert.show();
                errorAlert.html(msg);
                errorAlert.fadeOut(2000);
            }
        };

    successAlert.hide();
    errorAlert.hide();
    updateButton.hide();
    deleteButton.hide();


    var helpers = {
        color: function (c) {
            return new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);
        },
        aspectRatio: function () {
            return renderDoc.width() / renderDoc.height();
        },
        lerp: function (t, min, max) {
            return min + t * (max - min);
        },
        superShape: function (angle, m, n1, n2, n3) {

            var t1 = Math.pow(Math.abs(Math.cos(m / 4 * angle)), n2);
            var t2 = Math.pow(Math.abs(Math.sin(m / 4 * angle)), n3);

            return Math.pow(t1 + t2, -1 / n1);
        }
    }

    var controls = new THREE.OrbitControls(camera, renderDoc[0]);
    renderer.setSize(renderDoc.width(), renderDoc.height());
    renderDoc.append($(renderer.domElement));

    window.addEventListener('resize', function () {
        var width = renderDoc.width(),
            height = renderDoc.height();
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    camera.position.z = 5;

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    scene.add(directionalLight);

    // game logic
    var update = function () {
        directionalLight.position.x = camera.position.x;
        directionalLight.position.y = camera.position.y;
        directionalLight.position.z = camera.position.z;
    }

    // draw scene
    var render = function () {
        renderer.render(scene, camera);
    }


    // run game loop (update, render, repeat)
    var GameLoop = function () {
        requestAnimationFrame(GameLoop);

        update();
        render();
    }

    var updateGeometry = function (model) {
        if (model == null) {
            var geometry = new THREE.Geometry(),
                material = createMaterial(),
                model = new THREE.Mesh(geometry, material);
        }
        // add arrays for lon and lat
        var globe = [];
        for (var i = 0; i <= formData.subdivisions; i++) {
            globe[i] = [];
        }

        for (var i = 0; i <= formData.subdivisions; i++) {
            // map to lat
            var lat = helpers.lerp(i / formData.subdivisions, -Math.PI / 2, Math.PI / 2);
            t = helpers.lerp(Math.sin(formData.angle), 0, formData.ss2m);
            var r2 = helpers.superShape(lat, t, formData.ss2n1, formData.ss2n2, formData.ss2n3);

            for (var j = 0; j <= formData.subdivisions; j++) {
                // map to lon
                var lon = helpers.lerp(j / formData.subdivisions, -Math.PI, Math.PI);
                t = helpers.lerp(Math.sin(formData.angle), 0, formData.ss1m);
                var r1 = helpers.superShape(lon, t, formData.ss1n1, formData.ss1n2, formData.ss1n3);

                var x = formData.radius * r1 * Math.cos(lon) * r2 * Math.cos(lat),
                    y = formData.radius * r1 * Math.sin(lon) * r2 * Math.cos(lat),
                    z = formData.radius * r2 * Math.sin(lat);

                globe[i][j] = { x: x, y: y, z: z };
            }
        }

        // add geometry
        var geometry = model.geometry;
        geometry.vertices = [];
        geometry.faces = [];
        var index = 0;
        for (var i = 0; i < formData.subdivisions; i++) {
            for (var j = 0; j < formData.subdivisions; j++) {
                var v1 = globe[i][j],
                    v2 = globe[i + 1][j],
                    v3 = globe[i][j + 1],
                    v4 = globe[i + 1][j + 1];

                geometry.vertices.push(new THREE.Vector3(v1.x, v1.y, v1.z));
                geometry.vertices.push(new THREE.Vector3(v2.x, v2.y, v2.z));
                geometry.vertices.push(new THREE.Vector3(v3.x, v3.y, v3.z));
                geometry.vertices.push(new THREE.Vector3(v4.x, v4.y, v4.z));

                var i1 = index++,
                    i2 = index++,
                    i3 = index++,
                    i4 = index++;

                geometry.faces.push(new THREE.Face3(i2, i1, i3));
                geometry.faces.push(new THREE.Face3(i3, i4, i2));
            }
        }

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.verticesNeedUpdate = true;
        geometry.elementsNeedUpdate = true;
        geometry.normalsNeedUpdate = true;
        model.geometry = geometry;
        return model;
    }

    var createMaterial = function () {
        return new THREE.MeshPhongMaterial({ color: 0x00cc00, side: THREE.FrontSide });
    }

    var createGui = function () {

        if (gui !== null) {
            Object.keys(gui.__folders).forEach(function (k) {
                gui.removeFolder(gui.__folders[k]);
            });

            Object.keys(gui.__controllers).forEach(function (k) {
                gui.remove(gui.__controllers[k]);
            });
        } else {
            gui = new dat.GUI({ autoPlace: false });
        }

        controlsDoc.append($(gui.domElement));
        var params = {
            "background color": formData["background color"],
            "material color": formData["material color"],
            "scale": formData.scale,
            "lat_m": formData.ss2m,
            "lat_n1": formData.ss2n1,
            "lat_n2": formData.ss2n2,
            "lat_n3": formData.ss2n3,
            "lon_m": formData.ss1m,
            "lon_n1": formData.ss1n1,
            "lon_n2": formData.ss1n2,
            "lon_n3": formData.ss1n3,
            "angle": formData.angle,
            "subdivisions": formData.subdivisions
        };

        scene.background = helpers.color(params["background color"]);
        model.material.color = helpers.color(params["material color"]);

        var materialFolder = gui.addFolder("Material"),
            latitude = gui.addFolder("Latidude"),
            longitude = gui.addFolder("Longitude");

        // main
        gui.addColor(params, "background color").onChange(function (e) {
            scene.background = helpers.color(e);
        });

        // longitude
        longitude.add(params, "lon_m", 0, 20).onFinishChange(function (e) {
            formData.ss1m = e;
            model = updateGeometry(model);
        });
        longitude.add(params, "lon_n1", 0, 20).onFinishChange(function (e) {
            formData.ss1n1 = e;
            model = updateGeometry(model);
        });
        longitude.add(params, "lon_n2", 0, 20).onFinishChange(function (e) {
            formData.ss1n2 = e;
            model = updateGeometry(model);
        });
        longitude.add(params, "lon_n3", 0, 20).onFinishChange(function (e) {
            formData.ss1n3 = e;
            model = updateGeometry(model);
        });

        // latitude
        latitude.add(params, "lat_m", 0, 20).onFinishChange(function (e) {
            formData.ss2m = e;
            model = updateGeometry(model);
        });
        latitude.add(params, "lat_n1", 0, 20).onFinishChange(function (e) {
            formData.ss2n1 = e;
            model = updateGeometry(model);
        });
        latitude.add(params, "lat_n2", 0, 20).onFinishChange(function (e) {
            formData.ss2n2 = e;
            model = updateGeometry(model);
        });
        latitude.add(params, "lat_n3", 0, 20).onFinishChange(function (e) {
            formData.ss2n3 = e;
            model = updateGeometry(model);
        });


        // material
        materialFolder.add(params, "scale", 0, 3).onChange(function (e) {
            model.scale.x = e;
            model.scale.y = e;
            model.scale.z = e;
        });
        materialFolder.add(params, "angle", 0, Math.PI).onFinishChange(function (e) {
            formData.angle = e;
            model = updateGeometry(model);
        });
        materialFolder.add(params, "subdivisions", 2, 150).onFinishChange(function (e) {
            formData.subdivisions = parseInt(e);
            model = updateGeometry(model);
        });
        materialFolder.addColor(params, "material color").onChange(function (e) {
            model.material.color = helpers.color(e);
        });
    }

    var getSaved = function (pages) {
        $.ajax({
            method: 'GET',
            url: '/api/model?pages=' + (pages || 5),
            success: function (data) {
                var html = '';
                data.forEach(function (e) {
                    html += '<li><a class="jq-model" href="javascript:void(0);" data-model-id="' + e._id + '">' + e.name + '</a></li>';
                });
                html += '<li role="separator" class="divider"></li>';
                html += '<li id="model-load-more"><a href="javascript:void(0);">Load More</a></li>';
                $('#model-saved').html(html);

                bindDropdownLoader();
            },
            error: function (jqXHR) {
                alert('Request failed: ' + jqXHR);
            }
        });
    }

    var getApiModel = function (id) {

        $.ajax({
            method: 'GET',
            url: '/api/model/' + id,
            success: function (e) {
                formData = {
                    id: id,
                    subdivisions: e.subdivisions,
                    angle: e.angle,
                    scale: e.size,
                    ss1m: e.ss1m,
                    ss1n1: e.ss1n1,
                    ss1n2: e.ss1n2,
                    ss1n3: e.ss1n3,
                    ss2m: e.ss2m,
                    ss2n1: e.ss2n1,
                    ss2n2: e.ss2n2,
                    ss2n3: e.ss2n3,
                    "background color": e.background,
                    "material color": e.color,
                    radius: formData.radius
                };

                updateButton.show();
                deleteButton.show();
                $('#model-name').val(e.name);
                model.scale.x = e.size;
                model.scale.y = e.size;
                model.scale.z = e.size;
                model = updateGeometry(model);
                createGui(model);
            },
            error: function (jqXHR) {

            }
        });
    }

    var bindDropdownLoader = function () {
        $('#model-load-more').click(function (e) {
            apiModel.pages += apiModel.loadMoreIncrement;
            getSaved(apiModel.pages);
        });

        $('.jq-model').click(function (e) {
            var id = $(this).data("model-id");
            getApiModel(id);
        });
    }

    $('.jq-export-btn').click(function (e) {
        var obj = exporter.parse(model);
        var blob = new Blob([obj], { type: "octet/stream" })
        var url = URL.createObjectURL(blob);
        var name = $('#model-name').val();
        if (name === '') {
            name = 'super_shape'
        }
        this.download = name + '.obj';
        this.href = url;
    });

    $('#model-save').click(function (e) {
        var obj = {
            name: $('#model-name').val(),
            size: model.scale.x,
            background: [scene.background.r * 255, scene.background.g * 255, scene.background.b * 255],
            color: [model.material.color.r * 255, model.material.color.g * 255, model.material.color.b * 255],
        }
        if (!obj.name) {
            obj.name = 'super_shape';
        }
        Object.assign(obj, formData);
        $.ajax({
            method: 'POST',
            url: '/api/model',
            data: obj,
            success: function (data) {
                getSaved();
                getApiModel(data.id);
                notification.success('Model created!');
            },
            error: function (err) {
                notification.error("Unable to create new model: " + err.message);
            }
        });
    });


    updateButton.click(function (e) {
        var obj = {
            name: $('#model-name').val(),
            size: model.scale.x,
            background: [scene.background.r * 255, scene.background.g * 255, scene.background.b * 255],
            color: [model.material.color.r * 255, model.material.color.g * 255, model.material.color.b * 255],
        }
        if (!obj.name) {
            obj.name = 'super_shape';
        }

        var properties = ['scale', 'angle', 'subdivisions', 'ss1m', 'ss1n1', 'ss1n2', 'ss1n3',
            'ss2m', 'ss2n1', 'ss2n2', 'ss2n3'];

        properties.forEach(function (k) {
            obj[k] = formData[k];
        });

        $.ajax({
            method: 'PUT',
            url: '/api/model/' + formData.id,
            data: obj,
            success: function (msg) {
                getSaved();
                notification.success('Model updated!');
            },
            error: function (err) {
                notification.error("Unable to update model: " + err.message);
            }
        });
    });

    deleteButton.click(function (e) {
        $.ajax({
            method: 'DELETE',
            url: '/api/model/' + formData.id,
            success: function () {
                getSaved();
                notification.success('Model deleted!');
                updateButton.hide();
                deleteButton.hide();
            },
            error: function (err) {
                notification.error("Unable to delete model: " + err.message);
            }
        })
    });

    getSaved();
    var model = updateGeometry(model);
    scene.add(model);
    createGui(model);
    GameLoop();


});